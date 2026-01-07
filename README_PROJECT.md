# LivSync Healthcare Application

A modern healthcare management system built with Next.js and React using JavaScript.

## Project Overview

LivSync is a comprehensive healthcare application designed to:
- Manage patient appointments
- Store and retrieve medical records
- Connect patients with healthcare providers
- Maintain secure health information

## Getting Started

### Prerequisites
- Node.js 18.0 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Group-13-F29SO/LivSync.git
cd LivSync
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

See **FOLDER_STRUCTURE_GUIDE.txt** for detailed information about each folder and what files belong in them.

```
LivSync/
├── src/
│   ├── app/                 # Next.js app router - pages and routes
│   ├── components/          # Reusable React components
│   ├── pages/              # Legacy pages (if needed)
│   ├── styles/             # Global styles
│   ├── utils/              # Utility functions
│   ├── lib/                # Library functions and setup
│   ├── hooks/              # Custom React hooks
│   ├── constants/          # Application constants
│   ├── services/           # API services
│   └── context/            # React context
├── public/                 # Static assets
│   ├── images/
│   └── icons/
├── docs/                   # Documentation
└── Configuration files (next.config, tailwind.config, etc.)
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Technologies Used

- **Frontend**: Next.js, React, JavaScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **State Management**: React Query
- **Linting**: ESLint
- **Build Tool**: Next.js Built-in

## Features

- User authentication (Patient, Doctor, Admin roles)
- Appointment scheduling and management
- Medical records management
- Doctor availability management
- Responsive design
- Clean JavaScript codebase
- Comprehensive API integration

## Environment Variables

See `.env.example` for required environment variables:

- `NEXT_PUBLIC_API_URL` - API endpoint URL

## Development

### Adding New Pages

New pages should be created in `src/app/` using the App Router pattern:
```
src/app/feature/page.jsx
```

### Adding New Components

New React components should be placed in `src/components/` and follow the naming convention:
```
src/components/FeatureName/FeatureName.jsx
```

### Code Style

This project uses:
- JavaScript (not TypeScript)
- ESLint for code consistency
- Tailwind CSS for styling
- Camel case for variables/functions
- Pascal case for components

## Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please contact the development team or open an issue on GitHub.
