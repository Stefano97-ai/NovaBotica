import './app/shadcn.css';
import { AppProviders } from './app/providers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import './app/styles.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/dm-sans/latin-700.css';

createRoot(document.getElementById('root')!).render(<StrictMode><AppProviders><RouterProvider router={router}/></AppProviders></StrictMode>);
