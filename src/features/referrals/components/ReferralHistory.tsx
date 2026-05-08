import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    ChevronUp,
    ChevronDown,
    History,
    MessageSquare,
    AlertCircle,
    Send,
    User,
    CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Activity } from '@/features/quotes/api/quotes';

interface ReferralHistoryProps {
    activities: Activity[];
    isExpanded: boolean;
    onToggle: () => void;
    onAddComment: (comment: string) => Promise<void>;
}

const titleCase = (s: string) => {
    if (!s) return '-';
    return s
        .replace(/[_-]+/g, ' ')
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
};

export const ReferralHistory = React.memo(
    ({ activities, isExpanded, onToggle, onAddComment }: ReferralHistoryProps) => {
        const [showCommentForm, setShowCommentForm] = useState(false);
        const [newComment, setNewComment] = useState('');
        const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

        const handleAddComment = async () => {
            if (!newComment.trim()) return;
            await onAddComment(newComment.trim());
            setNewComment('');
            setShowCommentForm(false);
        };

        return (
            <Card className="bg-card border border-border overflow-hidden shadow-sm" data-section="referral_history">
                <CardHeader className="pb-4 hover:bg-muted/5 cursor-pointer transition-colors" onClick={onToggle}>
                    <div className="flex items-center justify-between">
                        <div className="flex-1 cursor-pointer" onClick={onToggle}>
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <History className="h-5 w-5 text-primary" />
                                Referral History & Timeline
                            </CardTitle>
                            <CardDescription>Click on any item to view detailed information</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {isExpanded && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowCommentForm(!showCommentForm);
                                    }}
                                    className="flex items-center gap-2 h-8 font-bold uppercase tracking-widest text-[10px] transition-all hover:scale-105"
                                >
                                    <MessageSquare className="h-4 w-4" />
                                    Add Comment
                                </Button>
                            )}
                            <div className="p-1.5 rounded-full hover:bg-muted transition-colors">
                                {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                            </div>
                        </div>
                    </div>
                </CardHeader>

                {isExpanded && (
                    <CardContent className="pt-0 pb-6">
                        {showCommentForm && (
                            <div className="mb-4 p-4 bg-muted/30 rounded-lg border border-border/60 backdrop-blur-sm">
                                <Label className="text-sm font-bold text-foreground mb-2 block uppercase tracking-wider">Add Comment</Label>
                                <Textarea
                                    placeholder="Enter your comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    rows={3}
                                    className="resize-none mb-3 bg-background border-border/40 focus-visible:ring-primary shadow-inner"
                                />
                                <div className="flex items-center gap-2 justify-end">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 font-semibold"
                                        onClick={() => {
                                            setShowCommentForm(false);
                                            setNewComment('');
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="h-8 font-bold uppercase tracking-widest text-[10px] transition-all hover:scale-105"
                                        onClick={handleAddComment}
                                        disabled={!newComment.trim()}
                                    >
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Add Comment
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {activities.length > 0 ? (
                                activities.map((activity) => {
                                    const isSystem = String(activity.actorType).toLowerCase() === 'system';
                                    const isExpanded = selectedActivityId === activity.id;

                                    const getIcon = () => {
                                        if (isSystem) {
                                            return <AlertCircle className="w-4 h-4 text-primary" />;
                                        }
                                        switch (titleCase(activity.actionType)) {
                                            case 'Comment Added':
                                                return <MessageSquare className="w-4 h-4 text-white" />;
                                            case 'Query Raised':
                                                return <Send className="w-4 h-4 text-white" />;
                                            case 'Assigned':
                                                return <User className="w-4 h-4 text-white" />;
                                            default:
                                                return <CheckCircle className="w-4 h-4 text-white" />;
                                        }
                                    };

                                    return (
                                        <div
                                            key={activity.id}
                                            className="border border-border/60 rounded-lg overflow-hidden transition-all hover:shadow-md hover:border-border"
                                        >
                                            <div
                                                className="p-3 cursor-pointer bg-background hover:bg-muted/20 transition-colors"
                                                onClick={() => setSelectedActivityId(isExpanded ? null : activity.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isSystem ? 'bg-primary/10 border border-primary/20' : 'bg-primary'
                                                            }`}
                                                    >
                                                        {getIcon()}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-sm font-bold text-foreground">
                                                                {titleCase(activity.actionType)}
                                                            </span>
                                                            <Badge variant="outline" className="text-[10px] font-bold uppercase py-0 px-1 bg-muted/40">
                                                                {titleCase(activity.actorType)}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                                                            <span>{titleCase(activity.actorType)}</span>
                                                            <span className="opacity-40">•</span>
                                                            <span>
                                                                {activity.createdAt
                                                                    ? new Date(activity.createdAt).toLocaleString()
                                                                    : '-'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex-shrink-0">
                                                        {isExpanded ? (
                                                            <ChevronUp className="w-4 h-4 text-gray-400" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4 text-gray-400" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="border-t border-border/40 bg-muted/10 p-4 animate-in slide-in-from-top-2 duration-200">
                                                    <div className="space-y-3">
                                                        {activity.comment ? (
                                                            <div>
                                                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Comment</div>
                                                                <div className="text-sm text-foreground bg-card p-3 rounded-lg border border-border/40 shadow-inner">
                                                                    {activity.comment}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-sm text-gray-500 italic">
                                                                No additional details available
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-6 text-gray-500">No history available</div>
                            )}
                        </div>
                    </CardContent>
                )}
            </Card>
        );
    },
);
