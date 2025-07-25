# Getting Started

To run this application:

- Install dependencies

  ```bash
  npm install
  ```

- Configure environment variables:
  To run this project, you need to configure Auth0 authentication. Follow these steps:

  1. Create a `.env.local` file in the root directory
  2. Copy your Auth0 application settings from the Auth0 Dashboard:

  - Domain
  - Client ID

  3. Add the following environment variables to `.env.local`:

  ```bash
  VITE_AUTH0_DOMAIN=your-auth0-domain.region.auth0.com
  VITE_AUTH0_CLIENT_ID=your-client-id
  VITE_AUTH0_CALLBACK_URL=http://localhost:3000/dashboard
  ```

  Replace `your-auth0-domain` and `your-client-id` with the values from your Auth0 application settings.

- Run the project
  ```bash
  npm run start
  ```

# Building For Production

To build this application for production:

```bash
npm run build
```

# Linting & Formatting

This project uses [Biome](https://biomejs.dev/) for linting and formatting. The following scripts are available:

```bash
npm run lint
npm run format
npm run check
```

# Routing

This project uses [TanStack Router](https://tanstack.com/router). The initial setup is a file based router. Which means that the routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add another a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from "@tanstack/react-router";
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you use the `<Outlet />` component.

Here is an example layout that includes a header:

```tsx
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { Link } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <>
      <header>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
        </nav>
      </header>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});
```

The `<TanStackRouterDevtools />` component is not required so you can remove it if you don't want it in your layout.

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
const peopleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/people",
  loader: async () => {
    const response = await fetch("https://swapi.dev/api/people");
    return response.json() as Promise<{
      results: {
        name: string;
      }[];
    }>;
  },
  component: () => {
    const data = peopleRoute.useLoaderData();
    return (
      <ul>
        {data.results.map((person) => (
          <li key={person.name}>{person.name}</li>
        ))}
      </ul>
    );
  },
});
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).

## Custom Auth0 Pages (`auth0-pages`)

The `auth0-pages` folder is designed to simplify the generation of custom HTML pages for Auth0 authentication. It helps break down large original HTML files into smaller, manageable chunks using **Handlebars** templates and combines CSS, JavaScript, and HTML into a single output file for deployment.

### How to Work with `auth0-pages`

1. **Navigate to the Folder**:

   ```bash
   cd auth0-pages
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Development Mode**:

   **For login page**

- Run the development server:
  ```bash
  npm run dev or npm run dev:login
  ```
- This uses the `auth-config.mock.js` file, allowing you to:
  - Work on styling and UI adjustments.
  - Test error states and other client-side behaviors.
- **Note**: Server-based functionalities like login, signup, and password reset will not work in this mode.
- In development mode, the **login page** is available at `http://localhost:5173/login`.
- You can also run the main project, and it should redirect you to the login page on startup.

  **For password reset page**

- Run the development server:
  ```bash
  npm run dev:password-reset
  ```
- In development mode, the **password reset page** is available at `http://localhost:5173/password-reset`.

4. **Build for Production**:

   - Generate the single output file:
     ```bash
     npm run build
     ```
   - The output file will be located in the `dist` folder.

5. **Deploy to Auth0**:
   - Take the generated file (e.g., `login.html` or `password-reset.html`) from the `dist` folder.
   - Go to the Auth0 Dashboard:
     - Navigate to **Branding** → **Universal Login** → **Advanced Options**.
     - Upload the `login.html` file to the **Login Page**.
     - Upload the `password-reset.html` file to the **Password Reset Page**.
   - Save the changes.

### Key Notes

- The `auth-config.mock.js` file is used during development to simulate Auth0 behaviors, enabling you to test UI and error states without relying on actual server responses.
- After deploying the updated files to the Auth0 dashboard, the new look will be available for the specified tenant.
