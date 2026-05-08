import React, { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { format, parseISO, isValid } from 'date-fns';
import { formatDistanceToNow } from 'date-fns';
import { apiGet, apiPatch } from '@/lib/api/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DatePickerWithDropdown } from '@/components/ui/date-picker-with-dropdown';
import { Label } from '@/components/ui/label';
import { Calendar, Upload, X } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { getBrokerCompany, getBrokerCompanyId, getBrokerLicense, setBrokerLicense } from '@/lib/auth';
import { uploadBrokerFile, updateBrokerLicense } from '@/features/brokers/api/brokers';
import { isDemoMode } from '@/lib/demo-mode';
import { formatFileSize } from '@/shared/utils/fileUtils';
import { BrokerSidebar } from './BrokerSidebar';
import { SharedNotificationBell, NotificationItem } from '@/components/layout/SharedNotificationBell';
import {
    normalizeNotificationEventKind,
    shouldOpenChatFromNotification,
} from '@/shared/notifications/notificationEventKinds';

/** Replace legacy "Technical"/"Non-Technical" labels with "Financial"/"Non-Financial" in notification text. */
function normalizeEndorsementLabels(text: string): string {
    if (!text) return text;
    return text
        .replace(/\bNon[-_\s]?Technical\b/gi, 'Non-Financial')
        .replace(/\bTechnical\b/gi, 'Financial');
}

export function calculateLicenseValidity(licenseEndDate: string | null | undefined): {
    daysRemaining: number;
    color: 'red' | 'yellow' | 'green';
    message: string;
} {
    if (!licenseEndDate) {
        return {
            daysRemaining: 0,
            color: 'red',
            message: 'No license on record',
        };
    }

    const today = new Date();
    const endDate = new Date(licenseEndDate);
    const timeDiff = endDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysRemaining < 0) {
        return {
            daysRemaining: 0,
            color: 'red',
            message: 'License expired',
        };
    }

    if (daysRemaining < 15) {
        return {
            daysRemaining,
            color: 'red',
            message: `License expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`,
        };
    }

    if (daysRemaining < 30) {
        return {
            daysRemaining,
            color: 'yellow',
            message: `License expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`,
        };
    }

    return {
        daysRemaining,
        color: 'green',
        message: `License expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`,
    };
}

export const LicenseBadge = React.memo(function LicenseBadge({ licenseEndDate }: { licenseEndDate: string | null | undefined }) {
    const validity = calculateLicenseValidity(licenseEndDate);

    const getButtonClasses = () => {
        switch (validity.color) {
            case 'red':
                return 'bg-red-500 hover:bg-red-600 text-white border-red-600';
            case 'yellow':
                return 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300';
            case 'green':
                return 'bg-green-500 hover:bg-green-600 text-white border-green-600';
            default:
                return 'bg-gray-500 hover:bg-gray-600 text-white border-gray-600';
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            className={`${getButtonClasses()} transition-colors rounded-md px-3 py-1.5 h-auto font-medium`}
        >
            <Calendar className="w-3 h-3 mr-1" />
            {validity.message}
        </Button>
    );
});

function parsePickerDate(value: string): Date | null {
    if (!value) return null;
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : null;
}

export function BrokerLayout() {
    const { toast } = useToast();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);

    useEffect(() => {
        if (!notifications || notifications.length === 0) return;

        const patterns = [
            /\/referral\/([^\/\?]+)/,
            /\/endorsements\/view\/([^\/\?]+)/,
            /\/endorsement\/([^\/\?]+)/
        ];

        let subjectId: string | null = null;
        for (const pattern of patterns) {
            const match = pathname.match(pattern);
            if (match && match[1]) {
                subjectId = match[1];
                break;
            }
        }

        if (subjectId) {
            const unreadForSubject = notifications.filter(
                (n) => String(n.subjectId) === String(subjectId) && !n.isRead
            );

            if (unreadForSubject.length > 0) {
                const ids = unreadForSubject.map((n) => String(n.id));
                apiPatch('/notifications/read', { ids }).catch((err) => {
                    console.error('Failed to mark notifications read from layout:', err);
                });

                setNotifications((prev) =>
                    prev.map((n) => (ids.includes(String(n.id)) ? { ...n, isRead: true } : n))
                );
            }
        }
    }, [pathname, notifications]);
    const [licenseDialogOpen, setLicenseDialogOpen] = useState(false);
    const [licenseData, setLicenseData] = useState({
        licenseNumber: '',
        validityFrom: '',
        validityTo: '',
        licenseImage: null as File | null,
        licenseImageUrl: null as string | null,
        licenseDocumentId: null as string | null,
    });
    const [isUploadingLicense, setIsUploadingLicense] = useState(false);
    const [isUpdatingLicense, setIsUpdatingLicense] = useState(false);

    const brokerLicense = getBrokerLicense();
    const company = getBrokerCompany();
    const licenseEndDate = brokerLicense?.validityEnd ?? company?.licenseEndDate ?? null;

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await apiGet('/notifications/unread-count');
            const referralNotifs = (response as any)?.referral?.notifications || [];
            const endorsementNotifs = (response as any)?.endorsement?.notifications || [];

            const allNotifs = [...referralNotifs, ...endorsementNotifs];

            const formattedNotifs: NotificationItem[] = allNotifs.map((n: any) => {
                let status = 'received';
                if (n.eventKind?.includes('APPROVED') || n.eventKind?.includes('ACCEPT')) status = 'approved';
                if (n.eventKind?.includes('REJECTED') || n.eventKind?.includes('DECLINE')) status = 'rejected';

                return {
                    id: n.id || Math.random().toString(),
                    type: n.domain || 'notification',
                    status,
                    message: normalizeEndorsementLabels(n.title || 'New Notification'),
                    details: normalizeEndorsementLabels(n.body || ''),
                    who: n.actor ? `${n.actor.name} (${n.actor.userType})` : '',
                    when: n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : '',
                    reference: n.subjectLabel || '',
                    isRead: n.isRead || false,
                    subjectId: n.subjectId,
                    createdAt: n.createdAt,
                    eventKind: n.eventKind || '',
                };
            });
            formattedNotifs.sort((a, b) =>
                new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime()
            );

            setNotifications(formattedNotifs);
        } catch (error) {
            console.error('Failed to fetch broker notifications:', error);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        const intervalId = setInterval(fetchNotifications, 60000);
        return () => clearInterval(intervalId);
    }, [fetchNotifications]);

    useEffect(() => {
        void fetchNotifications();
    }, [pathname, fetchNotifications]);

    useEffect(() => {
        const onFocus = () => {
            void fetchNotifications();
        };
        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                void fetchNotifications();
            }
        };

        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [fetchNotifications]);

    const handleNotificationClick = (n: NotificationItem) => {
        let path = '';
        const targetId = n.subjectId || n.id;
        const shouldOpenMessage = shouldOpenChatFromNotification(n.eventKind);
        const eventKind = normalizeNotificationEventKind(n.eventKind);

        const type = n.type?.toLowerCase();

        const isEndorsement = type === 'endorsement' || type === 'endorsements' || eventKind.includes('ENDORSEMENT');
        const isReferral = type === 'referral' || type === 'referrals' || eventKind.includes('REFERRAL') || (!isEndorsement && (eventKind.includes('QUERY') || eventKind.includes('CHAT')));

        if (isEndorsement) {
            path = `/broker/endorsements/view/${targetId}`;
        } else if (isReferral) {
            path = `/broker/referral/${targetId}`;
        }
        
        if (shouldOpenMessage && path) {
            path += (path.includes('?') ? '&' : '?') + 'openMessage=true';
        }
        
        if (path) {
            navigate(path);
        }
    };

    const handleLicenseUpdate = async () => {
        if (!licenseData.licenseNumber || !licenseData.validityFrom || !licenseData.validityTo) {
            toast({
                title: 'Missing Information',
                description: 'Please fill in all required fields.',
                variant: 'destructive',
            });
            return;
        }

        if (licenseData.validityTo < licenseData.validityFrom) {
            toast({
                title: 'Invalid Dates',
                description: 'Validity end date must be on or after the start date.',
                variant: 'destructive',
            });
            return;
        }

        if (!licenseData.licenseDocumentId) {
            toast({
                title: 'No License Document',
                description: 'Please upload a license document.',
                variant: 'destructive',
            });
            return;
        }

        const organizationId = getBrokerCompanyId();
        if (!organizationId) {
            toast({
                title: 'Session Error',
                description: 'Organization not found. Please log in again.',
                variant: 'destructive',
            });
            return;
        }

        try {
            setIsUpdatingLicense(true);
            const response = await updateBrokerLicense(organizationId, {
                validityStartDate: licenseData.validityFrom,
                validityEndDate: licenseData.validityTo,
                licenseNumber: licenseData.licenseNumber,
                licenseDocumentId: licenseData.licenseDocumentId,
            });

            if (response?.license) {
                setBrokerLicense({
                    licenseNumber: response.license.licenseNumber,
                    validityStart: response.license.validityStart,
                    validityEnd: response.license.validityEnd,
                    licenseDocumentFileId: response.license.licenseDocumentFileId,
                    licenseDocument: response.license.licenseDocument,
                    licenseDocumentUrl: response.license.licenseDocumentUrl,
                    licenseDocumentSize: response.license.licenseDocumentSize,
                });
            }

            toast({
                title: 'License updated successfully',
                description: 'Your broker license has been updated and is under review.',
            });
            setLicenseDialogOpen(false);
            setLicenseData({
                licenseNumber: '',
                validityFrom: '',
                validityTo: '',
                licenseImage: null,
                licenseImageUrl: null,
                licenseDocumentId: null,
            });
        } catch (error: any) {
            console.error('License update error:', error);
            toast({
                title: 'Update Failed',
                description: error.message || 'Failed to update license. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsUpdatingLicense(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast({
                title: 'Invalid File Type',
                description: 'Please upload a JPEG, PNG, SVG, or WebP image.',
                variant: 'destructive',
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: 'File Too Large',
                description: 'Please upload a file smaller than 5MB.',
                variant: 'destructive',
            });
            return;
        }

        setIsUploadingLicense(true);

        try {
            const uploadResponse = await uploadBrokerFile(file, 'license');

            if (uploadResponse.url && uploadResponse.fileId) {
                setLicenseData((prev) => ({
                    ...prev,
                    licenseImage: file,
                    licenseImageUrl: uploadResponse.url,
                    licenseDocumentId: uploadResponse.fileId,
                }));

                toast({
                    title: 'File Uploaded Successfully',
                    description: uploadResponse.message || `${file.name} has been uploaded successfully.`,
                });
            } else {
                throw new Error('No file data returned from upload');
            }
        } catch (error: any) {
            console.error('License upload error:', error);
            toast({
                title: 'Upload Failed',
                description: error.message || 'Failed to upload license document. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsUploadingLicense(false);
        }
    };

    const removeLicenseFile = () => {
        setLicenseData((prev) => ({
            ...prev,
            licenseImage: null,
            licenseImageUrl: null,
            licenseDocumentId: null,
        }));
        const fileInput = document.getElementById('license-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-background">
                <BrokerSidebar />
                <div className="flex-1 flex flex-col min-w-0">
                    <header className="h-16 flex items-center border-b bg-primary/5 shadow-sm">
                        <div className="flex items-center gap-4 px-6 w-full">
                            <SidebarTrigger className="hover:bg-muted/50 transition-colors" />
                            <div className="flex-1">
                                <h1 className="text-xl font-bold text-foreground">Distributor Portal</h1>
                                <p className="text-sm text-muted-foreground">
                                    Insurance distributor management platform
                                </p>
                            </div>
                            <SharedNotificationBell 
                                notifications={notifications} 
                                onNotificationClick={handleNotificationClick} 
                            />
                            {isDemoMode() && (
                                <img
                                    src="/riyadh.png"
                                    alt="Riyadh Re"
                                    className="h-10 w-auto object-contain mr-4"
                                />
                            )}
                            <Dialog
                                open={licenseDialogOpen}
                                onOpenChange={(open) => {
                                    setLicenseDialogOpen(open);
                                    if (open && brokerLicense) {
                                        setLicenseData((prev) => ({
                                            ...prev,
                                            licenseNumber: brokerLicense.licenseNumber,
                                            validityFrom: brokerLicense.validityStart,
                                            validityTo: brokerLicense.validityEnd,
                                            licenseImageUrl: brokerLicense.licenseDocumentUrl ?? null,
                                            licenseDocumentId: brokerLicense.licenseDocumentFileId ?? null,
                                        }));
                                    }
                                }}
                            >
                                <DialogTrigger asChild>
                                    <div className="cursor-pointer">
                                        <LicenseBadge licenseEndDate={licenseEndDate} />
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
                                    <DialogHeader>
                                        <DialogTitle>Update Broker License</DialogTitle>
                                        <DialogDescription>
                                            Enter your new license details to update your broker license information.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="licenseNumber">License Number</Label>
                                            <Input
                                                id="licenseNumber"
                                                placeholder="Enter license number"
                                                value={licenseData.licenseNumber}
                                                onChange={(e) =>
                                                    setLicenseData((prev) => ({
                                                        ...prev,
                                                        licenseNumber: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="validityFrom">Validity Start Date</Label>
                                                <DatePickerWithDropdown
                                                    value={parsePickerDate(licenseData.validityFrom)}
                                                    onChange={(date) =>
                                                        setLicenseData((prev) => {
                                                            const validityFrom = date ? format(date, 'yyyy-MM-dd') : '';
                                                            const validityToDate = parsePickerDate(prev.validityTo);
                                                            const validityTo =
                                                                validityToDate && date && validityToDate < date
                                                                    ? ''
                                                                    : prev.validityTo;

                                                            return {
                                                                ...prev,
                                                                validityFrom,
                                                                validityTo,
                                                            };
                                                        })
                                                    }
                                                    placeholder="Pick a date"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="validityTo">Validity End Date</Label>
                                                <DatePickerWithDropdown
                                                    value={parsePickerDate(licenseData.validityTo)}
                                                    onChange={(date) =>
                                                        setLicenseData((prev) => ({
                                                            ...prev,
                                                            validityTo: date ? format(date, 'yyyy-MM-dd') : '',
                                                        }))
                                                    }
                                                    fromDate={parsePickerDate(licenseData.validityFrom) ?? undefined}
                                                    fromYear={(parsePickerDate(licenseData.validityFrom) ?? new Date()).getFullYear() - 1}
                                                    toYear={new Date().getFullYear() + 10}
                                                    placeholder="Pick a date"
                                                    disabled={!licenseData.validityFrom}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <Label>
                                                License Document Image <span className="text-destructive">*</span>
                                            </Label>
                                            <div className="space-y-3">
                                                {!licenseData.licenseImage &&
                                                    !licenseData.licenseImageUrl &&
                                                    !licenseData.licenseDocumentId ? (
                                                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                                                        <div className="text-center">
                                                            {isUploadingLicense ? (
                                                                <>
                                                                    <div className="mx-auto h-12 w-12 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                                                                    <div className="mt-4">
                                                                        <span className="text-sm font-medium text-muted-foreground">
                                                                            Uploading...
                                                                        </span>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                                                    <div className="mt-4">
                                                                        <label htmlFor="license-file" className="cursor-pointer">
                                                                            <span className="text-sm font-medium text-primary hover:text-primary/80">
                                                                                Upload license image
                                                                            </span>
                                                                            <input
                                                                                id="license-file"
                                                                                type="file"
                                                                                className="sr-only"
                                                                                accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                                                                                onChange={handleFileUpload}
                                                                                disabled={isUploadingLicense}
                                                                            />
                                                                        </label>
                                                                        <p className="text-xs text-muted-foreground mt-1">
                                                                            PNG, JPG, SVG, WebP up to 5MB
                                                                        </p>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-14 h-14 rounded bg-background border flex items-center justify-center overflow-hidden p-1">
                                                                {isUploadingLicense ? (
                                                                    <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                                                ) : licenseData.licenseImageUrl ? (
                                                                    <img
                                                                        src={licenseData.licenseImageUrl}
                                                                        alt="License Preview"
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <Upload className="h-4 w-4 text-primary" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                {licenseData.licenseImage ? (
                                                                    <>
                                                                        <p
                                                                            className="text-sm font-medium truncate"
                                                                            title={licenseData.licenseImage.name}
                                                                        >
                                                                            {licenseData.licenseImage.name}
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {formatFileSize(licenseData.licenseImage.size)}
                                                                        </p>
                                                                        {isUploadingLicense ? (
                                                                            <p className="text-xs text-muted-foreground animate-pulse">
                                                                                Uploading...
                                                                            </p>
                                                                        ) : licenseData.licenseImageUrl ? (
                                                                            <p className="text-xs text-green-600">
                                                                                ✓ Uploaded successfully
                                                                            </p>
                                                                        ) : (
                                                                            <p className="text-xs text-destructive">
                                                                                ✗ Upload failed. Please remove and try again.
                                                                            </p>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <p className="text-sm font-medium">Current license document</p>
                                                                        {brokerLicense?.licenseDocument && (
                                                                            <p
                                                                                className="text-xs text-muted-foreground truncate"
                                                                                title={brokerLicense.licenseDocument}
                                                                            >
                                                                                {brokerLicense.licenseDocument}
                                                                            </p>
                                                                        )}
                                                                        {brokerLicense?.licenseDocumentSize != null &&
                                                                            brokerLicense.licenseDocumentSize !== '' && (
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    {formatFileSize(
                                                                                        Number(brokerLicense.licenseDocumentSize),
                                                                                    )}
                                                                                </p>
                                                                            )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={removeLicenseFile}
                                                            className="text-muted-foreground hover:text-destructive"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setLicenseDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleLicenseUpdate} disabled={isUpdatingLicense}>
                                            {isUpdatingLicense ? 'Updating...' : 'Update License'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </header>
                    <main className="flex-1 overflow-hidden">
                        <Outlet />
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
