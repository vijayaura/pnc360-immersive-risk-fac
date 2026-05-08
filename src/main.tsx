import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import 'react-international-phone/style.css';
import { bootstrapApp } from '@/bootstrap';

bootstrapApp();

createRoot(document.getElementById('root')!).render(<App />);
