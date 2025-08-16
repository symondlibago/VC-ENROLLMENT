# EduEnroll - Modern Enrollment System UI Theme

A cutting-edge, mobile-friendly enrollment system UI theme built with React, Vite, Tailwind CSS, and Framer Motion. Features smooth liquid-like animations, bold typography, and a sleek modern design with a dominant #9c262c color scheme.

## 🚀 Features

- **Modern Design**: Sleek, professional interface with bold typography and high-energy visuals
- **Responsive Layout**: Mobile-first design that adapts seamlessly across all devices
- **Smooth Animations**: Liquid-like effects powered by Framer Motion
- **Collapsible Sidebar**: Space-efficient navigation with smooth transitions
- **Custom Color Scheme**: Gradient tones of electric white, whitish pink, snowy white, and black with dominant #9c262c
- **Fast Performance**: Optimized for minimal load times and smooth interactions
- **Modern Icons**: Lucide React icons throughout the interface
- **Interactive Components**: Hover effects, micro-interactions, and fluid transitions

## 🎨 Design System

### Color Palette
- **Dominant Red**: #9c262c (Navigation, Header, Sidebar)
- **Electric White**: #ffffff
- **Whitish Pink**: #fef7f7
- **Snowy White**: #fafafa
- **Deep Black**: #0a0a0a

### Typography
- **Font Family**: Inter, system fonts
- **Bold Headlines**: 800 weight with tight letter spacing
- **Body Text**: 700 weight for emphasis

## 🛠️ Tech Stack

- **React 19.1.0**: Modern React with hooks
- **Vite 6.3.5**: Lightning-fast build tool
- **Tailwind CSS 4.1.7**: Utility-first CSS framework
- **Framer Motion 12.15.0**: Smooth animations and transitions
- **Lucide React**: Modern icon library
- **Radix UI**: Accessible component primitives
- **shadcn/ui**: Pre-built component library

## 📦 Installation

1. **Extract the project**:
   ```bash
   unzip enrollment-system-theme.zip
   cd enrollment-system
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   # or
   npm install
   # or
   yarn install
   ```

3. **Start development server**:
   ```bash
   pnpm run dev
   # or
   npm run dev
   # or
   yarn dev
   ```

4. **Build for production**:
   ```bash
   pnpm run build
   # or
   npm run build
   # or
   yarn build
   ```

## 🏗️ Project Structure

```
enrollment-system/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── Sidebar.jsx   # Collapsible navigation
│   │   ├── Header.jsx    # Top navigation bar
│   │   └── Dashboard.jsx # Main dashboard content
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── App.jsx           # Main application component
│   ├── App.css           # Custom styles and animations
│   └── main.jsx          # Application entry point
├── dist/                 # Production build output
├── package.json          # Project dependencies
└── vite.config.js        # Vite configuration
```

## 🎯 Key Components

### Sidebar
- Collapsible navigation with smooth animations
- Icon-only collapsed state
- Active state indicators
- Badge notifications
- Responsive mobile overlay

### Header
- Search functionality
- User profile dropdown
- Notification center
- Theme toggle (ready for dark mode)
- Mobile-friendly hamburger menu

### Dashboard
- Statistics cards with hover effects
- Recent enrollments list
- Upcoming deadlines tracker
- Quick action buttons
- Responsive grid layout

## 🎨 Custom Animations

The theme includes several custom animation classes:

- `.liquid-morph`: Smooth transitions with custom easing
- `.liquid-hover`: Scale and shadow effects on hover
- `.liquid-button`: Shimmer effect on button hover
- `.card-hover`: Card lift animation with border highlight
- `.glass-effect`: Backdrop blur with transparency

## 📱 Responsive Design

- **Mobile**: < 768px - Collapsed sidebar with overlay
- **Tablet**: 768px - 1024px - Adaptive layout
- **Desktop**: > 1024px - Full expanded sidebar

## 🚀 Deployment

The project includes a pre-built `dist/` folder ready for deployment to any static hosting service:

- Netlify
- Vercel
- GitHub Pages
- AWS S3
- Any web server

## 🔧 Customization

### Colors
Update the CSS variables in `src/App.css`:

```css
:root {
  --dominant-red: #9c262c;
  --electric-white: #ffffff;
  --whitish-pink: #fef7f7;
  --snowy-white: #fafafa;
  --deep-black: #0a0a0a;
}
```

### Components
All components are modular and can be easily customized or extended. The design system is built with Tailwind CSS for easy theming.

## 📄 License

This project is provided as a UI theme template. Feel free to use and modify for your projects.

## 🤝 Support

For questions or support, please refer to the documentation or create an issue in your project repository.

---

**Built with ❤️ using modern web technologies**

