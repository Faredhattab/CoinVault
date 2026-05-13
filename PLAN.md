# Numismatic Collection Platform
## Spec-Driven Development Project

---

# Executive Summary

A cloud-native, mobile-first multilingual web application for managing and showcasing a personal collection of:
- coins
- paper money / banknotes

The platform provides:
- a private admin dashboard for collection management
- a public-facing digital gallery for visitors

The system emphasizes:
- responsive mobile-first UX
- multilingual support (English + Arabic)
- searchable collection management
- statistics and visualization
- geographic exploration
- lightweight cloud-native architecture

English is the default platform language, while Arabic is fully supported with RTL layout and Arabic content/search support.

The platform is intended as a personal archival and showcase system rather than a marketplace or valuation platform.

Development will follow a Spec-Driven Development (SDD) workflow using SpecKit, where every major feature is implemented through:
1. specification
2. clarification
3. technical planning
4. task generation
5. implementation
6. validation

---

# Project Goals

## Primary Goals
- Manage a personal collection efficiently
- Publicly showcase collection items
- Support multilingual content
- Provide excellent mobile usability
- Maintain lightweight cloud-native architecture
- Keep implementation maintainable and scalable

---

# Non-Goals

The MVP intentionally excludes:
- marketplaces
- trading systems
- AI recognition
- valuation systems
- advanced search engines
- social networking features

---

# Core Functional Scope

## Admin Features
- secure admin authentication
- Google login support
- CRUD management for items
- image uploads
- nested category management
- statistics dashboard
- newsletter management
- export features
- multilingual content management

---

## Public Features
- browse collection
- item detail pages
- lightweight search
- statistics visualization
- interactive world map
- newsletter subscription
- related item suggestions
- public share links

---

# Technical Stack

## Frontend
- Next.js
- Tailwind CSS
- TypeScript

## Backend
- FastAPI

## Database
- PostgreSQL

## Infrastructure Services
- Supabase Auth
- Supabase Storage

## Visualization
- Recharts
- Leaflet.js
- OpenStreetMap

---

# Core Architectural Principles

## Mobile-First
The platform MUST prioritize smartphone usability before desktop layouts.

---

## Cloud-Native
The platform MUST avoid unnecessary infrastructure management and remain deployment-friendly.

---

## Spec-Driven Development
All major features MUST begin with:
- specification
- clarification
- planning
- generated task breakdown

before implementation starts.

---

## Simplicity First
The MVP MUST avoid unnecessary complexity and focus on stable core functionality.

---

# Data Model Overview

## Item

Represents:
- coins
- banknotes

Each item includes:
- UUID
- collection ID
- multilingual title
- type
- country code
- denomination
- year
- acquisition year
- tags
- visibility
- images

---

## Collection ID

A collector-friendly identifier used for organization and display.

Format:
```text
[CountryCode]-[Number]
```

Examples:
- NL-0001
- GR-0015
- US-0231
- NA-0004

`NA` can represent:
- unknown origin
- uncategorized items
- non-country pieces

---

## Categories

Supports fully custom nested categories.

Items can belong to multiple categories.

Relationship:
- many-to-many

---

## Subscribers

Stores newsletter subscriptions.

---

# Public URL Structure

UUID-based routing:

```text
/collection/{uuid}
```

Example:

```text
/collection/f8a3c2b1-91d2
```

---

# Item Structure

Each collection item includes:

| Field | Example |
|---|---|
| Item UUID | f8a3c2b1-91d2 |
| Collection ID | NL-0001 |
| Title | 1 Gulden |
| Type | Coin / Banknote |
| Country Code | NL / GR / US / NA |
| Year | 1957 |
| Denomination | 1 Gulden |
| Amount | 3 *(private/admin-only)* |
| Acquisition Year | 2024 *(optional)* |
| Tags | queen, europe |
| Images | Front / Back |
| Visibility | Public / Private |

---

# Authentication

## Admin Authentication
Supports:
- email/password login
- Google account login

---

# Multilingual Support

## Default Language
- English

## Supported Language
- Arabic
  - RTL layout
  - Arabic content
  - Arabic search support

---

# Mobile-First Design

A strict project requirement.

The platform is designed primarily for:
- smartphones
- tablets

Features include:
- responsive layouts
- touch-friendly UI
- optimized image loading
- collapsible filters
- fast mobile browsing

Desktop support remains fully available.

---

# Image Management

Supports:
- front image
- back image
- optional additional gallery images

Image strategy:
- optimized web-display quality
- responsive image delivery
- lightweight loading for mobile devices

---

# Search & Filtering

MVP search remains intentionally lightweight.

Supports:
- title
- country
- year
- denomination
- tags

---

# Statistics & Visualization

## Example Statistics
- collection by country
- coins vs banknotes
- historical period distribution
- total items vs unique items
- most duplicated items
- public vs private items

---

## Planned Future Statistics
The system keeps the logic and database structure for:
- items added over time
- collection growth analytics

However, related visual/statistical features are not planned for the initial MVP.

---

## Visualization Types
- pie charts
- bar charts
- timelines
- interactive maps

---

# Interactive World Map

Using:
- Leaflet.js
- OpenStreetMap

Features:
- country-level markers
- item origin visualization
- clickable pins displaying related items

The MVP focuses on country-based geographic representation rather than exact mint/city locations.

---

# Export Features

Allow exporting collection data to:
- PDF
- CSV
- printable catalog pages

Useful for:
- backups
- physical records
- collection sharing
- insurance documentation

---

# Acquisition Tracking

Optional acquisition tracking for each item.

Supported field:
- Acquisition Year *(can be empty)*

Useful for:
- collection history
- future timeline statistics
- tracking collection growth

---

# Public Share Links

Each public item has a shareable UUID-based URL.

Example:
```text
/collection/f8a3c2b1-91d2
```

Useful for:
- forums
- social media
- collectors
- documentation

---

# Related Items

Each item page can display related items based on:
- same country
- same denomination
- same historical period
- similar tags

Improves collection discovery and browsing experience.

---

# Newsletter & Notifications

## Newsletter Subscription
Visitors can subscribe using their email address.

Possible use cases:
- new collection additions
- featured items
- collection updates

---

## Subscriber Notifications

Admin can send notifications for:
- newly added items
- featured collections
- major updates

Initial implementation:
- simple built-in emailing system
- subscriber database management
- manual notification sending

---

# Architecture Overview

```text
Next.js Frontend
        │
        ▼
FastAPI Backend
        │
        ▼
PostgreSQL Database
        │
        ├── Supabase Auth
        └── Supabase Storage
```

---

# Development Workflow Using SpecKit

Each implementation phase will follow:

1. `/specify`
2. `/clarify`
3. `/plan`
4. `/tasks`
5. implementation
6. validation/checklist

Each phase MUST produce:
- specification documents
- technical plans
- implementation tasks
- validation criteria

---

# Implementation Phases

---

# Phase 1 — Project Foundation

## Goal
Establish core project infrastructure.

## Scope
- initialize frontend
- initialize backend
- setup PostgreSQL
- configure Supabase services
- environment configuration
- deployment setup
- CI/CD basics

---

# Phase 2 — Authentication & Authorization

## Goal
Implement secure admin authentication.

## Scope
- email/password login
- Google OAuth login
- protected admin routes
- session handling
- role management

---

# Phase 3 — Collection Data Model

## Goal
Implement collection entities and relationships.

## Scope
- items
- categories
- item-category relationships
- multilingual fields
- UUID routing
- visibility system

---

# Phase 4 — Admin Dashboard

## Goal
Implement collection management UI.

## Scope
- create/edit/delete items
- image uploads
- category management
- visibility controls
- acquisition year support

---

# Phase 5 — Public Gallery

## Goal
Implement public collection browsing experience.

## Scope
- item pages
- public browsing
- responsive layouts
- public share links
- related items

---

# Phase 6 — Search & Filtering

## Goal
Implement lightweight collection search.

## Scope
- title search
- country filtering
- year filtering
- denomination filtering
- tag filtering

---

# Phase 7 — Statistics & Visualization

## Goal
Implement collection analytics.

## Scope
- country distribution
- coins vs banknotes
- historical distribution
- duplicated items
- public/private statistics

---

# Phase 8 — Interactive World Map

## Goal
Visualize collection origins geographically.

## Scope
- Leaflet integration
- OpenStreetMap integration
- country-level markers
- related item previews

---

# Phase 9 — Export Features

## Goal
Support collection exports.

## Scope
- CSV export
- PDF export
- printable catalog pages

---

# Phase 10 — Newsletter System

## Goal
Implement lightweight subscriber system.

## Scope
- newsletter subscription
- subscriber management
- manual notification sending
- new additions notifications

---

# Phase 11 — Arabic Localization

## Goal
Complete Arabic language support.

## Scope
- RTL layouts
- Arabic translations
- Arabic search support
- Arabic metadata rendering

---

# Phase 12 — Final Hardening & Optimization

## Goal
Prepare MVP for stable deployment.

## Scope
- performance optimization
- mobile optimization
- image optimization
- SEO improvements
- accessibility review
- security review

---

# Long-Term Future Features (Out of Scope for MVP)

- advanced search engine
- OCR recognition
- AI coin recognition
- collection valuation
- marketplace/trading
- social features
- public APIs
- advanced analytics
- mint/city precision maps

---

# Success Criteria

The MVP is considered successful when:
- admin can fully manage collection items
- visitors can browse collection publicly
- mobile experience is smooth
- Arabic support functions correctly
- exports work correctly
- statistics render correctly
- world map functions correctly
- deployment is stable and cloud-native
