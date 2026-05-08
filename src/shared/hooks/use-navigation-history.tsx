import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";

// Simple navigation history manager using sessionStorage for persistence
const HISTORY_KEY = 'navigation_history';

const getNavigationHistory = (): string[] => {
  try {
    const stored = sessionStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const setNavigationHistory = (history: string[]) => {
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Ignore storage errors
  }
};

export const useNavigationHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isInitialMount = useRef(true);

  useEffect(() => {
    const currentPath = location.pathname + location.search;
    const history = getNavigationHistory();
    
    // On initial mount, always add current page to history if it's not already there
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Add current page if it's not the last item in history
      if (history.length === 0 || history[history.length - 1] !== currentPath) {
        const newHistory = [...history, currentPath];
        setNavigationHistory(newHistory);
      }
      return;
    }
    
    // Only add to history if it's a different path
    if (history.length === 0 || history[history.length - 1] !== currentPath) {
      const newHistory = [...history, currentPath];
      
      // Keep only last 10 entries to prevent bloat
      if (newHistory.length > 10) {
        newHistory.shift();
      }
      
      setNavigationHistory(newHistory);
    }
  }, [location]);

  const navigateBack = (fallbackPath: string = "/") => {
    const history = getNavigationHistory();
    const currentPath = location.pathname + location.search;
    
    console.log('=== NAVIGATION BACK DEBUG ===');
    console.log('Current path:', currentPath);
    console.log('Full history:', history);
    console.log('Fallback path:', fallbackPath);
    
    // Remove current path from history and find the previous different path
    let previousPath = fallbackPath;
    
    // Find the most recent path that's different from current
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i] !== currentPath) {
        const candidatePath = history[i];
        
        console.log('Checking candidate path:', candidatePath);
        
        // Skip login pages
        const isLoginPage = candidatePath.includes('/login');
        if (isLoginPage) {
          console.log('Skipping login page:', candidatePath);
          continue;
        }
        
        // For market admin insurer management pages (but not quote pages), skip quote pages
        if (currentPath.includes('/market-admin/') && 
            (currentPath.includes('/insurer/') || currentPath.includes('/create-insurer')) &&
            !currentPath.includes('/quote/')) {
          const isQuotePage = candidatePath.includes('/quote/');
          
          if (isQuotePage) {
            console.log('Skipping quote page for market admin insurer management pages:', candidatePath);
            continue;
          }
        }
        
        // For product config pages, prefer going back to dashboard/management pages
        if (currentPath.includes('/product-config')) {
          const isQuotePage = candidatePath.includes('/quote/');
          const isIndividualPage = candidatePath.match(/\/(broker|insurer)\/[^\/]+\/[^\/]+$/);
          
          if (isQuotePage || isIndividualPage) {
            console.log('Skipping quote/individual page for product config:', candidatePath);
            continue;
          }
        }
        
        // For insurer individual pages, prefer going back to management pages  
        if (currentPath.match(/\/insurer\/[^\/]+\/[^\/]+$/)) {
          const isQuotePage = candidatePath.includes('/quote/');
          if (isQuotePage) {
            console.log('Skipping quote page for insurer individual page:', candidatePath);
            continue;
          }
        }
        
        // For market admin insurer quote pages, prefer going back to insurer dashboard
        if (currentPath.match(/\/market-admin\/insurer\/[^\/]+\/quote\/[^\/]+$/)) {
          const isQuotePage = candidatePath.includes('/quote/');
          const isInsurerDashboard = candidatePath.match(/\/market-admin\/insurer\/[^\/]+\/dashboard$/);
          
          // Skip other quote pages but allow insurer dashboard
          if (isQuotePage && !isInsurerDashboard) {
            console.log('Skipping other quote page for market admin insurer quote page:', candidatePath);
            continue;
          }
        }
        
        // For market admin broker quote pages, prefer going back to broker dashboard
        if (currentPath.match(/\/market-admin\/broker\/[^\/]+\/quote\/[^\/]+$/)) {
          const isQuotePage = candidatePath.includes('/quote/');
          const isBrokerDashboard = candidatePath.match(/\/market-admin\/broker\/[^\/]+\/dashboard$/);
          
          // Skip other quote pages but allow broker dashboard
          if (isQuotePage && !isBrokerDashboard) {
            console.log('Skipping other quote page for market admin broker quote page:', candidatePath);
            continue;
          }
        }
        
        // Found a valid previous path
        previousPath = candidatePath;
        console.log('Found valid previous path:', previousPath);
        // Update history by removing current and later entries
        const updatedHistory = history.slice(0, i + 1);
        setNavigationHistory(updatedHistory);
        break;
      }
    }
    
    // If we're in a portal and no valid previous path found, use the provided fallback
    // Only default to portal dashboard if fallback is the root "/"
    if (previousPath === fallbackPath && fallbackPath === "/") {
      if (currentPath.includes('/market-admin/')) {
        // For market admin insurer product config, go back to that specific insurer's dashboard
        const insurerProductConfigMatch = currentPath.match(/\/market-admin\/insurer\/([^\/]+)\/product-config$/);
        if (insurerProductConfigMatch) {
          const insurerId = insurerProductConfigMatch[1];
          previousPath = `/market-admin/insurer/${insurerId}/dashboard`;
        }
        // For other market admin insurer-related pages, go to insurer management
        else if (currentPath.includes('/insurer/') || currentPath.includes('/create-insurer')) {
          previousPath = '/market-admin/insurer-management';
        } else {
          previousPath = '/market-admin/dashboard';
        }
        console.log('Using market-admin fallback');
      } else if (currentPath.includes('/broker/')) {
        previousPath = '/broker/dashboard';
        console.log('Using broker dashboard fallback');
      } else if (currentPath.includes('/insurer/')) {
        // For insurer product config, go to insurer dashboard
        if (currentPath.includes('/product-config')) {
          previousPath = '/insurer/dashboard';
        } else {
          previousPath = '/insurer/dashboard';
        }
        console.log('Using insurer dashboard fallback');
      }
    }
    
    console.log('Final navigation target:', previousPath);
    console.log('=== END NAVIGATION DEBUG ===');
    
    navigate(previousPath);
  };

  const getPreviousPath = (fallbackPath: string = "/") => {
    const history = getNavigationHistory();
    const currentPath = location.pathname + location.search;
    
    // Find the most recent path that's different from current
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i] !== currentPath) {
        return history[i];
      }
    }
    
    return fallbackPath;
  };

  return {
    navigateBack,
    getPreviousPath
  };
};
