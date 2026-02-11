# Osaifill Frontend

This is the React frontend for Osaifill, built with Vite, TypeScript, and Tailwind CSS.

## Prerequisites

- Node.js 22.x or higher
- npm or yarn

## Setup for Development

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`. By default, it expects the backend to be running at `http://localhost:8000`.

## Key Technologies

- **React 19**: Modern UI library.
- **Vite**: Ultra-fast build tool and dev server.
- **Tailwind CSS v4**: Utility-first CSS framework.
- **shadcn/ui**: High-quality UI components.
- **i18next**: Internationalization (Supports English and Japanese).
- **Recharts**: Data visualization for budget summaries.

## Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run lint`: Runs ESLint to check for code quality issues.
- `npm run preview`: Previews the production build locally.

## Project Structure

- `src/components/`: Reusable UI components.
- `src/locales/`: Translation files for i18n.
- `src/pages/`: Main view components for different routes.
- `src/lib/`: Utility functions and shared logic.

## Internationalization (i18n)

We use `i18next` for managing translations. All display strings should be added to the JSON files in `src/locales/` rather than hardcoded in components.

## Docker

For production-like environment or easy deployment, we recommend using the root [docker-compose.yml](../docker-compose.yml). The frontend container includes an Nginx server that acts as a reverse proxy for the backend.

## License

This project is licensed under the [MIT License](../LICENSE).
