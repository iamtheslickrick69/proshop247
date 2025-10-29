# ProShop 24/7 - Lovable Frontend Specification

## Document Overview

This document defines the complete frontend design and implementation for ProShop 24/7's landing page, built using Lovable (no-code React builder). The design follows Apple/OpenAI aesthetic principles with Fox Hollow branding, featuring the game-changing dual-demo system that allows prospects to test custom AI demos instantly.

---

## Design Philosophy

### Aesthetic Inspiration

**Apple/OpenAI Widget Style**:
- Clean, spacious, minimalist
- Premium feel without being pretentious
- Focus on product, not decoration
- Smooth animations, subtle interactions
- Mobile-first responsive design

**Fox Hollow Branding**:
- Primary color: Forest Green (#2E7D32)
- Secondary color: Warm Gray (#616161)
- Accent color: Gold (#D4AF37)
- Natural imagery: golf courses, sunsets, grass textures
- Professional yet approachable tone

### Key Principles

1. **Clarity Over Cleverness** - Obvious what to do, no guessing
2. **Speed** - Fast loading, instant interactions
3. **Focus** - One clear call-to-action per section
4. **Trust** - Professional, credible, proven (Fox Hollow case study)
5. **Delight** - Subtle animations, smooth transitions

---

## Page Structure Overview

### One-Page Scroll Layout

```
┌─────────────────────────────────────────────────────────┐
│  Navigation Bar                                          │
│  - Logo  |  Features  |  Pricing  |  Contact  | [Sign Up]│
└─────────────────────────────────────────────────────────┘
│
├─ 1. HERO SECTION (Above Fold)
│  ├─ Headline: "Your Golf Course, Answered 24/7"
│  ├─ Subheadline: "AI-powered voice agent..."
│  └─ CTA: [Try Fox Hollow Demo] [Upload Your Course]
│
├─ 2. DUAL-DEMO SECTION ⭐ CORE INNOVATION
│  ├─ Left: Fox Hollow Pre-Built Demo
│  │   ├─ [Test Text Chat]
│  │   └─ [Call Voice Demo: 1-800-XXX-XXXX]
│  │
│  └─ Right: Custom Demo Generator
│      ├─ Upload modal trigger
│      └─ "Create your own demo in 30 seconds"
│
├─ 3. HOW IT WORKS (3-Step Explainer)
│  ├─ Step 1: Connect → Icon + Description
│  ├─ Step 2: Customize → Icon + Description
│  └─ Step 3: Go Live → Icon + Description
│
├─ 4. FEATURES SHOWCASE (Grid Layout)
│  ├─ 24/7 Availability
│  ├─ Conversation Memory
│  ├─ Natural Voice
│  ├─ Instant Bookings
│  ├─ Multi-Channel
│  └─ Smart Analytics
│
├─ 5. FOX HOLLOW CASE STUDY
│  ├─ "As Featured At..." badge
│  ├─ Logo + Course photo
│  ├─ Testimonial quote (placeholder for launch)
│  └─ Results metrics (post-launch)
│
├─ 6. PRICING (Simple, Transparent)
│  ├─ Free Demo (25 interactions)
│  ├─ Starter Plan ($199/mo)
│  ├─ Professional Plan ($399/mo)
│  └─ Enterprise (Custom)
│
├─ 7. FINAL CTA
│  ├─ Headline: "Ready to Transform Your Golf Course?"
│  └─ [Get Started Free] [Schedule Demo]
│
└─ 8. FOOTER
    ├─ Links (About, Features, Pricing, Contact, Privacy)
    ├─ Social media icons
    └─ © 2024 ProShop 24/7. Powered by Claude.
```

---

## Section 1: Hero Section

### Layout

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│              Your Golf Course, Answered 24/7             │
│                                                          │
│     AI-powered voice agent that remembers every customer │
│     Never miss a booking. Always sound professional.     │
│                                                          │
│     ┌──────────────────┐  ┌──────────────────┐         │
│     │ Try Fox Hollow   │  │ Upload Your      │         │
│     │ Demo →           │  │ Course →         │         │
│     └──────────────────┘  └──────────────────┘         │
│                                                          │
│          [Background: Soft golf course image]           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Component Specifications

**Headline**:
- Text: "Your Golf Course, Answered 24/7"
- Font: 56px bold, sans-serif (Poppins or Inter)
- Color: Dark gray (#1A1A1A)
- Line height: 1.2
- Responsive: 36px on mobile

**Subheadline**:
- Text: "AI-powered voice agent that remembers every customer"
- Font: 24px regular, sans-serif
- Color: Medium gray (#616161)
- Line height: 1.5
- Responsive: 18px on mobile

**Secondary Subheadline**:
- Text: "Never miss a booking. Always sound professional."
- Font: 18px regular
- Color: Medium gray (#757575)

**CTA Buttons** (Side-by-Side):
1. **Primary**: "Try Fox Hollow Demo →"
   - Background: Forest Green (#2E7D32)
   - Text: White, 16px semi-bold
   - Padding: 16px 32px
   - Border radius: 8px
   - Hover: Darker green (#1B5E20)
   - Shadow: 0 4px 12px rgba(46, 125, 50, 0.3)

2. **Secondary**: "Upload Your Course →"
   - Background: White
   - Text: Forest Green, 16px semi-bold
   - Border: 2px solid Forest Green
   - Padding: 16px 32px
   - Border radius: 8px
   - Hover: Light green background (#E8F5E9)

**Background**:
- Subtle golf course image (50% opacity)
- Gradient overlay: White → Transparent
- Mobile: Solid color background (no image)

---

## Section 2: Dual-Demo System

### Layout (Side-by-Side)

```
┌────────────────────────────────────────────────────────────┐
│                    Try Our AI Assistant                    │
│           Choose your path: Pre-built or Custom            │
│                                                            │
│  ┌──────────────────────┐  ┌──────────────────────┐      │
│  │  FOX HOLLOW DEMO     │  │  CUSTOM DEMO         │      │
│  │  ─────────────────   │  │  ─────────────────   │      │
│  │                      │  │                      │      │
│  │  [Fox Hollow Logo]   │  │  [Upload Icon]       │      │
│  │                      │  │                      │      │
│  │  Test our polished   │  │  Upload your course  │      │
│  │  demo with real      │  │  data and get a      │      │
│  │  Fox Hollow data     │  │  custom demo in 30s  │      │
│  │                      │  │                      │      │
│  │  ┌────────────────┐  │  │  ┌────────────────┐  │      │
│  │  │ Test Text Chat │  │  │  │ Create My Demo │  │      │
│  │  └────────────────┘  │  │  └────────────────┘  │      │
│  │                      │  │                      │      │
│  │  📞 Call:            │  │  ✨ Features:        │      │
│  │  1-800-XXX-XXXX     │  │  • AI file analysis  │      │
│  │                      │  │  • 25 free tests     │      │
│  │                      │  │  • Shareable link    │      │
│  └──────────────────────┘  └──────────────────────┘      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Component: DemoCard (Reusable)

```javascript
// Lovable Component Prompt:
/*
Create a demo card component with:
- Width: 45% (desktop), 100% (mobile)
- Background: White
- Border: 1px solid #E0E0E0
- Border radius: 12px
- Padding: 32px
- Shadow: 0 2px 8px rgba(0,0,0,0.1)
- Hover effect: Lift (translateY -4px, stronger shadow)

Props:
- title (string)
- description (string)
- icon (image/icon component)
- primaryButton (object: text, onClick)
- secondaryInfo (array of strings)
*/
```

**Fox Hollow Demo Card**:
- Title: "Fox Hollow Demo"
- Icon: Fox Hollow logo (100px width)
- Description: "Test our polished demo with real Fox Hollow Golf Course data"
- Primary Button: "Test Text Chat" (opens chat widget)
- Secondary Info:
  - "📞 Call: 1-800-FOX-GOLF"
  - "See how it handles real inquiries"

**Custom Demo Card**:
- Title: "Custom Demo"
- Icon: Upload icon (cloud with up arrow)
- Description: "Upload your course data and get a custom demo in 30 seconds"
- Primary Button: "Create My Demo" (opens onboarding modal)
- Secondary Info:
  - "✨ AI analyzes your files"
  - "🔗 25 free interactions"
  - "📤 Shareable link for your team"

---

## Section 3: How It Works

### Layout (3 Columns)

```
┌────────────────────────────────────────────────────────────┐
│                     How It Works                           │
│             Get up and running in 3 simple steps           │
│                                                            │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│   │    1     │    │    2     │    │    3     │          │
│   │  🔌      │    │  ⚙️      │    │  🚀      │          │
│   │          │    │          │    │          │          │
│   │ Connect  │    │Customize │    │ Go Live  │          │
│   │          │    │          │    │          │          │
│   │ Link your│    │ Set your │    │ Launch & │          │
│   │ phone &  │    │ hours,   │    │ start    │          │
│   │ systems  │    │ pricing, │    │ answering│          │
│   │          │    │ & voice  │    │ calls    │          │
│   └──────────┘    └──────────┘    └──────────┘          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Component: StepCard

```javascript
// Lovable Component:
/*
Props:
- number (1, 2, 3)
- icon (emoji or icon component)
- title (string)
- description (string)

Style:
- Width: 30% (desktop), 100% (mobile)
- Text align: center
- Background: Light gray (#F5F5F5)
- Border radius: 8px
- Padding: 24px
*/
```

**Step 1: Connect**
- Icon: 🔌
- Title: "Connect Your Systems"
- Description: "Link your phone number, website, and existing booking tools in minutes"

**Step 2: Customize**
- Icon: ⚙️
- Title: "Customize Your Agent"
- Description: "Set your hours, pricing, menu, and choose your voice. Make it yours."

**Step 3: Go Live**
- Icon: 🚀
- Title: "Go Live 24/7"
- Description: "Launch your AI assistant and start answering calls instantly. No downtime."

---

## Section 4: Features Showcase

### Layout (Grid: 3x2)

```
┌────────────────────────────────────────────────────────────┐
│                      Key Features                          │
│                                                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │ 24/7        │ │ Memory      │ │ Natural     │        │
│  │ Availability│ │ System      │ │ Voice       │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
│                                                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │ Instant     │ │ Multi-      │ │ Smart       │        │
│  │ Bookings    │ │ Channel     │ │ Analytics   │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Component: FeatureCard

**Style**:
- Background: White
- Border: None
- Box shadow: 0 1px 4px rgba(0,0,0,0.08)
- Border radius: 8px
- Padding: 24px
- Icon: 48px, Forest Green
- Title: 18px bold
- Description: 14px regular, gray

**Features**:

1. **24/7 Availability**
   - Icon: 🌙
   - Description: "Never miss a call. Your AI assistant answers instantly, even at 2am on holidays."

2. **Conversation Memory**
   - Icon: 🧠
   - Description: "Recognizes returning customers and remembers every conversation forever."

3. **Natural Voice**
   - Icon: 🎙️
   - Description: "Sounds human, not robotic. Powered by the most advanced text-to-speech technology."

4. **Instant Bookings**
   - Icon: 📅
   - Description: "Captures tee times, restaurant reservations, and event inquiries automatically."

5. **Multi-Channel**
   - Icon: 💬
   - Description: "Handle phone calls, text messages, and web chat from one system."

6. **Smart Analytics**
   - Icon: 📊
   - Description: "Track call volume, booking trends, and customer satisfaction in real-time."

---

## Component: Onboarding Modal (Custom Demo)

### Modal Structure (3 Steps)

```
┌─────────────────────────────────────────────────────────┐
│  Create Your Custom Demo               [X Close]        │
│  ──────────────────────────────────────────────────     │
│                                                          │
│  Progress: ●──○──○  (Step 1 of 3)                      │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │                                                 │    │
│  │  STEP 1: Basic Information                     │    │
│  │                                                 │    │
│  │  Course Name *                                  │    │
│  │  ┌─────────────────────────────────────────┐   │    │
│  │  │ Sunset Golf Club                        │   │    │
│  │  └─────────────────────────────────────────┘   │    │
│  │                                                 │    │
│  │  Location *                                     │    │
│  │  ┌─────────────────────────────────────────┐   │    │
│  │  │ Phoenix, AZ                             │   │    │
│  │  └─────────────────────────────────────────┘   │    │
│  │                                                 │    │
│  │  Website URL *                                  │    │
│  │  ┌─────────────────────────────────────────┐   │    │
│  │  │ https://sunsetgolf.com                  │   │    │
│  │  └─────────────────────────────────────────┘   │    │
│  │                                                 │    │
│  │  Email Address * (for demo link)               │    │
│  │  ┌─────────────────────────────────────────┐   │    │
│  │  │ manager@sunsetgolf.com                  │   │    │
│  │  └─────────────────────────────────────────┘   │    │
│  │                                                 │    │
│  │            [Cancel]    [Next: Upload Files →]  │    │
│  │                                                 │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Step 1: Basic Information

**Fields**:
- Course Name (text input, required)
- Location (text input, "City, State" format, required)
- Website URL (URL input, required)
- Email Address (email input, required)

**Validation**:
- All fields required (show error if empty)
- Email format validation
- URL format validation

**UI Elements**:
- Input fields: 100% width, 16px padding, border radius 4px
- Labels: 14px semi-bold, above inputs
- Error messages: Red text (#D32F2F), 12px, below inputs
- Progress indicator: 3 dots, current step filled

### Step 2: Upload Assets (Optional)

```
┌─────────────────────────────────────────────────────────┐
│  Create Your Custom Demo               [X Close]        │
│  ──────────────────────────────────────────────────     │
│                                                          │
│  Progress: ○──●──○  (Step 2 of 3)                      │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │                                                 │    │
│  │  STEP 2: Upload Assets (Optional)              │    │
│  │                                                 │    │
│  │  Restaurant Menu (PDF or Image)                 │    │
│  │  ┌──────────────────────────────────────────┐  │    │
│  │  │  📄 Drag & drop or click to upload      │  │    │
│  │  │     Max 5MB • PDF, JPG, PNG             │  │    │
│  │  └──────────────────────────────────────────┘  │    │
│  │                                                 │    │
│  │  Scorecard (PDF or Image)                      │    │
│  │  ┌──────────────────────────────────────────┐  │    │
│  │  │  📄 Drag & drop or click to upload      │  │    │
│  │  │     Max 5MB • PDF, JPG, PNG             │  │    │
│  │  └──────────────────────────────────────────┘  │    │
│  │                                                 │    │
│  │  Course Logo (Image)                           │    │
│  │  ┌──────────────────────────────────────────┐  │    │
│  │  │  🖼️ Drag & drop or click to upload      │  │    │
│  │  │     Max 5MB • JPG, PNG                  │  │    │
│  │  └──────────────────────────────────────────┘  │    │
│  │                                                 │    │
│  │  💡 Tip: Our AI will analyze your files and    │    │
│  │     extract menu items, hole details, etc.     │    │
│  │                                                 │    │
│  │          [← Back]    [Next: Quick Details →]   │    │
│  │                                                 │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Upload Component**:
- Drag & drop zone (200px height)
- Click to browse files
- File type validation (client-side)
- File size validation (5MB limit)
- Upload progress bar (if file selected)
- Preview thumbnail after upload

### Step 3: Quick Details

```
┌─────────────────────────────────────────────────────────┐
│  Create Your Custom Demo               [X Close]        │
│  ──────────────────────────────────────────────────     │
│                                                          │
│  Progress: ○──○──●  (Step 3 of 3)                      │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │                                                 │    │
│  │  STEP 3: Quick Details                         │    │
│  │                                                 │    │
│  │  Operating Hours (Optional)                     │    │
│  │  ┌─────────────────────────────────────────┐   │    │
│  │  │ 7am-7pm daily                           │   │    │
│  │  └─────────────────────────────────────────┘   │    │
│  │                                                 │    │
│  │  Phone Number (Optional)                        │    │
│  │  ┌─────────────────────────────────────────┐   │    │
│  │  │ (602) 555-1234                          │   │    │
│  │  └─────────────────────────────────────────┘   │    │
│  │                                                 │    │
│  │  Services & Amenities                          │    │
│  │  ☑ 18-hole course    ☐ 9-hole course          │    │
│  │  ☑ Restaurant        ☐ Bar                    │    │
│  │  ☑ Event venue       ☐ Wedding venue          │    │
│  │  ☑ Driving range     ☐ Pro shop               │    │
│  │  ☐ Golf lessons      ☐ Club fitting           │    │
│  │                                                 │    │
│  │  ✨ We'll analyze your website and files to    │    │
│  │     extract additional details automatically.   │    │
│  │                                                 │    │
│  │          [← Back]    [🚀 Generate My Demo]     │    │
│  │                                                 │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Fields**:
- Operating Hours (text input, optional)
- Phone Number (tel input, optional)
- Services (checkboxes, multi-select)

**Generate Button**:
- Text: "🚀 Generate My Demo"
- Background: Forest Green
- Full width button
- Shows loading spinner when clicked
- Disabled during processing

### Success Screen

```
┌─────────────────────────────────────────────────────────┐
│  Your Demo is Ready! 🎉                    [X Close]    │
│  ──────────────────────────────────────────────────     │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │                                                 │    │
│  │         ✅ Demo Successfully Created            │    │
│  │                                                 │    │
│  │  Your Custom Demo Link:                        │    │
│  │  ┌─────────────────────────────────────────┐   │    │
│  │  │ proshop247.com/demo/abc123xyz   [Copy] │   │    │
│  │  └─────────────────────────────────────────┘   │    │
│  │                                                 │    │
│  │  Test Your Demo:                               │    │
│  │  ┌──────────────────────┐  ┌────────────────┐ │    │
│  │  │  💬 Test Text Chat   │  │  📞 Call Now   │ │    │
│  │  └──────────────────────┘  └────────────────┘ │    │
│  │                                                 │    │
│  │  📊 You have 25 free interactions               │    │
│  │  🔗 Share this link with your team!             │    │
│  │                                                 │    │
│  │  💡 Processing your files in the background...  │    │
│  │     (Menu & scorecard analysis: ~30 seconds)    │    │
│  │                                                 │    │
│  │                   [Close & Test Demo →]         │    │
│  │                                                 │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Elements**:
- Success checkmark (large, green)
- Demo URL (copyable)
- Two action buttons (Test Chat, Call)
- Interaction counter (25 remaining)
- Processing note (if files were uploaded)
- Close button (redirects to demo page)

---

## Component: Chat Widget

### Chat Widget (Embedded)

```
┌─────────────────────────────────────┐
│  💬 Chat with ProShop AI    [- ×]  │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🤖 Hi! I'm the ProShop AI   │   │
│  │    assistant. How can I     │   │
│  │    help you today?          │   │
│  └─────────────────────────────┘   │
│                                     │
│        ┌───────────────────────┐   │
│        │ What are your hours?  │   │
│        └───────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🤖 We're open Mon-Fri 7am-  │   │
│  │    8pm, weekends 6am-9pm!   │   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│  Type your message...      [Send]  │
└─────────────────────────────────────┘
```

**Style**:
- Position: Fixed, bottom-right corner
- Width: 380px (desktop), 100% (mobile)
- Height: 600px (desktop), 80vh (mobile)
- Border radius: 12px
- Shadow: 0 8px 24px rgba(0,0,0,0.15)
- Z-index: 1000

**Header**:
- Background: Forest Green
- Text: White, 16px bold
- Height: 56px
- Minimize/Close buttons

**Message Bubbles**:
- Agent (left-aligned):
  - Background: #F5F5F5
  - Text: #1A1A1A
  - Border radius: 12px 12px 12px 4px
  - Max width: 70%
  - Icon: 🤖 emoji

- User (right-aligned):
  - Background: Forest Green
  - Text: White
  - Border radius: 12px 12px 4px 12px
  - Max width: 70%

**Input Field**:
- Border: 1px solid #E0E0E0
- Border radius: 24px
- Padding: 12px 16px
- Placeholder: "Type your message..."
- Send button: Forest Green, white icon

**Features**:
- Auto-scroll to bottom
- Typing indicator ("Agent is typing...")
- Timestamp on hover
- Message delivery confirmation

---

## Responsive Design Breakpoints

### Desktop (>1024px)
- Full layout as specified
- Side-by-side demo cards
- 3-column features grid
- Fixed chat widget (bottom-right)

### Tablet (768px - 1024px)
- Stacked demo cards (still large)
- 2-column features grid
- Slightly reduced padding
- Chat widget: 360px width

### Mobile (<768px)
- Single column layout
- Stacked demo cards (full width)
- Single column features
- Hero: Reduced font sizes (36px headline)
- Buttons: Full width
- Chat widget: Full screen modal
- Navigation: Hamburger menu

**Mobile-First Approach**:
- Design for mobile, enhance for desktop
- Touch-friendly targets (min 44x44px)
- Simplified navigation
- Faster loading (smaller images)

---

## Color Scheme & Typography

### Primary Colors

```css
:root {
  /* Primary Palette */
  --forest-green: #2E7D32;
  --forest-green-dark: #1B5E20;
  --forest-green-light: #E8F5E9;

  /* Secondary Palette */
  --warm-gray: #616161;
  --warm-gray-light: #757575;
  --gold-accent: #D4AF37;

  /* Neutral Palette */
  --white: #FFFFFF;
  --off-white: #FAFAFA;
  --light-gray: #F5F5F5;
  --medium-gray: #E0E0E0;
  --dark-gray: #1A1A1A;

  /* Semantic Colors */
  --success: #4CAF50;
  --error: #D32F2F;
  --warning: #FFA000;
  --info: #1976D2;
}
```

### Typography

```css
/* Font Stack */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Font Sizes */
--font-h1: 56px;      /* Hero headline */
--font-h2: 40px;      /* Section headers */
--font-h3: 28px;      /* Subsection headers */
--font-body-lg: 18px; /* Large body text */
--font-body: 16px;    /* Standard body */
--font-body-sm: 14px; /* Small text */
--font-caption: 12px; /* Captions, labels */

/* Font Weights */
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--line-height-tight: 1.2;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

---

## User Flows

### Flow 1: Test Fox Hollow Demo (Text Chat)

```
1. User lands on homepage
   ↓
2. Scrolls to Dual-Demo section
   ↓
3. Clicks "Test Text Chat" on Fox Hollow card
   ↓
4. Chat widget opens (bottom-right)
   ↓
5. Auto-greeting appears: "Hi! I'm the Fox Hollow assistant..."
   ↓
6. User types: "What are your hours?"
   ↓
7. Agent responds with hours
   ↓
8. User continues conversation...
   ↓
9. User closes chat (satisfied with demo)
```

### Flow 2: Create Custom Demo

```
1. User lands on homepage
   ↓
2. Clicks "Upload Your Course" (Hero CTA)
   ↓
3. Onboarding modal opens - Step 1
   ↓
4. User fills: Name, Location, Website, Email
   ↓
5. Clicks "Next: Upload Files →"
   ↓
6. Step 2: User uploads menu.pdf, scorecard.pdf
   ↓
7. Clicks "Next: Quick Details →"
   ↓
8. Step 3: User enters hours, selects services
   ↓
9. Clicks "🚀 Generate My Demo"
   ↓
10. Loading spinner (3 seconds)
    ↓
11. Success screen: Demo URL shown
    ↓
12. User clicks "Test Text Chat"
    ↓
13. Chat widget opens with custom course data
    ↓
14. User tests demo, sees it works
    ↓
15. User copies link, shares with GM via email
    ↓
16. GM opens link, tests demo (counts toward 25 limit)
    ↓
17. Both impressed → Click "Get Started" → Lead captured
```

### Flow 3: Voice Demo Call

```
1. User clicks "Call Voice Demo: 1-800-XXX-XXXX"
   ↓
2. Phone app opens with number pre-filled
   ↓
3. User taps "Call"
   ↓
4. Twilio receives call → Routes to FastAPI
   ↓
5. Agent greeting: "Thanks for calling Fox Hollow!"
   ↓
6. User speaks: "I want to book a tee time"
   ↓
7. Agent responds naturally (via ElevenLabs)
   ↓
8. Conversation continues...
   ↓
9. User hangs up (impressed by voice quality)
   ↓
10. Returns to website → Clicks "Get Started"
```

---

## Lovable Implementation Notes

### Creating the Project in Lovable

**Step 1: Create New Project**
- Name: "ProShop 24/7 Landing Page"
- Template: Start from scratch (blank)
- Style: Modern/Clean

**Step 2: Set Global Styles**
```
Use Inter font family
Primary color: #2E7D32 (Forest Green)
Secondary color: #616161 (Warm Gray)
Background: #FFFFFF
Text: #1A1A1A
```

**Step 3: Build Sections (Top to Bottom)**

1. Navigation Bar
2. Hero Section
3. Dual-Demo Section
4. How It Works
5. Features Showcase
6. Fox Hollow Case Study
7. Pricing
8. Final CTA
9. Footer

**Step 4: Add Components**

- DemoCard (reusable component)
- StepCard (reusable component)
- FeatureCard (reusable component)
- OnboardingModal (multi-step form)
- ChatWidget (embedded iframe or React component)

**Step 5: Add Interactions**

- Button hover effects
- Smooth scroll to sections
- Modal open/close
- Form validation
- File upload preview
- Chat widget toggle

### Lovable-Specific Prompts

**Example Prompt for Hero Section**:
```
Create a hero section with:
- Full viewport height
- Centered content
- Headline: "Your Golf Course, Answered 24/7" (56px bold, dark gray)
- Subheadline: "AI-powered voice agent..." (24px regular, medium gray)
- Two buttons side-by-side:
  * "Try Fox Hollow Demo" (green background, white text)
  * "Upload Your Course" (white background, green border)
- Background: Subtle golf course image with gradient overlay
- Mobile responsive (stacked layout, smaller fonts)
```

**Example Prompt for Demo Cards**:
```
Create two cards side-by-side (desktop) / stacked (mobile):

Card 1:
- Title: "Fox Hollow Demo"
- Icon: [upload Fox Hollow logo]
- Description: "Test our polished demo..."
- Button: "Test Text Chat" (green, full width)
- Phone number: "📞 1-800-FOX-GOLF"

Card 2:
- Title: "Custom Demo"
- Icon: Upload cloud icon
- Description: "Upload your course data..."
- Button: "Create My Demo" (green, full width)
- Features list: 3 bullet points

Style both cards with:
- White background
- Border: 1px solid #E0E0E0
- Border radius: 12px
- Shadow: 0 2px 8px rgba(0,0,0,0.1)
- Hover: Lift effect (translateY -4px)
```

---

## Performance Optimization

### Loading Speed Targets

- **First Contentful Paint**: <1.5 seconds
- **Largest Contentful Paint**: <2.5 seconds
- **Time to Interactive**: <3.5 seconds

### Optimization Strategies

1. **Image Optimization**
   - WebP format with JPG fallback
   - Lazy loading for below-fold images
   - Responsive images (srcset)
   - Max size: 200KB per image

2. **Code Splitting**
   - Load chat widget on demand (not on initial load)
   - Load modal code when triggered
   - Defer non-critical JavaScript

3. **Asset Compression**
   - Minify CSS/JS
   - Gzip compression
   - Remove unused CSS

4. **Font Loading**
   - font-display: swap
   - Preload critical fonts
   - Subset fonts (Latin characters only)

---

## Accessibility (WCAG 2.1 Level AA)

### Requirements

1. **Color Contrast**
   - Text: Minimum 4.5:1 ratio
   - Large text: Minimum 3:1 ratio
   - Buttons: 3:1 ratio

2. **Keyboard Navigation**
   - All interactive elements focusable
   - Visible focus indicators
   - Logical tab order
   - Skip to content link

3. **Screen Reader Support**
   - Alt text for all images
   - ARIA labels for icons
   - Semantic HTML (h1-h6, nav, main, footer)
   - Form labels properly associated

4. **Forms**
   - Error messages clear and descriptive
   - Required fields marked
   - Validation feedback

---

## Next Steps

After this document is approved:
1. Create DEPLOYMENT.md (Railway setup, environment variables, CI/CD, monitoring, production checklist)
2. Create BUILD_CHECKLIST.md (Complete step-by-step build guide, testing checklist, launch checklist)

---

**Document Status**: Draft v1.0
**Last Updated**: 2025-10-28
**Next Review**: After approval and before DEPLOYMENT.md creation
