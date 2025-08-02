# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Admintermas - Next.js Business Management System

## Project Description
A comprehensive business management system for hotel/thermal spa operations built with Next.js 15. Features integrated POS, inventory management, reservation system, purchase processing with AI, and multi-channel communication automation.

## Technology Stack
- **Frontend**: Next.js 15.3.3 (App Router) + React 18 + TypeScript
- **Database**: Supabase (PostgreSQL) with 80+ migrations
- **UI**: Tailwind CSS + Radix UI components
- **AI Integration**: OpenAI GPT, Anthropic Claude
- **Services**: WhatsApp automation, email processing, PDF analysis
- **Additional**: Excel import/export, PDF generation, QR codes

## Development Commands
```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture Overview
- **App Router**: Next.js 15 with server/client components
- **Server Actions**: Located in `src/actions/` for data operations
- **Database**: Supabase with Row Level Security (RLS) policies
- **AI Processing**: Automated invoice processing, product matching, email analysis
- **Modular Design**: Each business module is self-contained

## Key Business Modules

### 1. Dashboard System (`/dashboard/`)
- Role-based navigation and access control
- Real-time business analytics
- Modular widget system

### 2. Product Management (`/dashboard/configuration/products/`)
- Complete CRUD with Excel import/export
- AI-powered product matching system
- Integration with Odoo ERP
- SKU generation and inventory tracking

### 3. Reservation System (`/dashboard/reservations/`)
- Calendar-based booking interface
- Modular reservations for complex packages
- Season-based pricing with automatic calculations
- Client integration and payment tracking

### 4. POS System (`/dashboard/pos/`)
- Multi-location point of sale
- Real-time inventory integration
- Multiple payment methods
- Receipt generation and printing

### 5. Purchase Management (`/dashboard/purchases/`)
- AI-powered PDF invoice processing
- Automatic product matching and data extraction
- Supplier integration with approval workflows
- Intelligent error handling and validation

### 6. Client Management (`/dashboard/customers/`)
- CRM with email integration
- Automated email analysis using AI
- Tag-based customer segmentation
- Import/export with validation

### 7. Inventory System (`/dashboard/inventory/`)
- Multi-warehouse support
- Physical inventory counting with Excel templates
- Movement tracking and audit trails
- Integration with purchases and sales

### 8. Supplier Management (`/dashboard/suppliers/`)
- Comprehensive vendor management
- Rating and performance tracking
- Contact management and communication history
- Part-time supplier categorization

## AI Integration Features
- **PDF Processing**: Automated invoice text extraction and parsing
- **Product Matching**: Intelligent matching algorithm for purchase orders
- **Email Analysis**: Automatic categorization and client association
- **WhatsApp Bot**: Multi-user messaging automation
- **Content Generation**: Anthropic Claude integration for document processing

## Database Structure
- **Core Tables**: Products, Suppliers, Clients, Reservations, Sales, Inventory
- **RLS Policies**: Comprehensive row-level security implementation
- **Audit System**: Change tracking for all critical operations
- **Migrations**: 80+ database migrations showing active development

## Key Directories
```
src/
├── app/                 # Next.js App Router pages
├── components/         # Reusable React components
├── actions/           # Server actions for data operations
├── lib/               # Utility libraries (Supabase, AI services)
├── types/             # TypeScript type definitions
├── hooks/             # Custom React hooks
├── utils/             # Helper utilities and algorithms
└── contexts/          # React contexts for state management

supabase/
├── migrations/        # Database schema migrations
└── config.toml       # Supabase configuration

scripts/               # 200+ maintenance and utility scripts
docs/                  # Comprehensive documentation system
```

## Development Patterns
- Use Server Actions for database operations
- Implement optimistic UI updates where appropriate
- Follow existing component patterns in `src/components/`
- Maintain type safety with TypeScript interfaces in `src/types/`
- Use Supabase client from `src/lib/supabase/` 

## AI Service Integration
- OpenAI client configured in `src/lib/openai`
- Anthropic Claude client in `src/lib/anthropic`
- PDF processing utilities in `src/utils/`
- Product matching algorithm in `src/utils/product-matching-ai.ts`

## Security Considerations
- All database access protected by RLS policies
- Role-based permissions throughout application
- Sensitive API keys managed through environment variables
- Audit logging for critical operations

## Testing and Scripts
- Extensive script library in `/scripts/` for database maintenance
- SQL utilities for data migration and cleanup
- Test data generation scripts available
- Debug endpoints for development testing

## Documentation
- Comprehensive module documentation in `/docs/modules/`
- Troubleshooting guides in `/docs/troubleshooting/`
- Installation and setup guides in `/docs/installation/`
- API documentation in `/docs/api/`

## Common Development Workflows
1. **Adding New Features**: Create server actions first, then UI components
2. **Database Changes**: Always create migrations in `supabase/migrations/`
3. **AI Integration**: Use existing patterns in `src/lib/` for consistency
4. **Component Development**: Follow Radix UI patterns for accessibility
5. **Testing**: Use debug pages in `/dashboard/` for development testing