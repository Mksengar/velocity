# Velocity BI — System Architecture

**Project:** Velocity BI  
**Version:** 1.0.0  
**Architecture:** Layered REST API Architecture  
**Frontend:** HTML, CSS, JavaScript  
**Backend:** Python Flask  
**Database:** MySQL  
**Authentication:** JWT  
**Visualization:** Chart.js / Plotly.js  

---

# 1. Architecture Overview

Velocity BI is a web-based Business Intelligence and Data Analytics platform.

The system allows users to:

- Register and log in
- Upload datasets
- Preview datasets
- Clean data
- Perform exploratory data analysis
- Calculate statistics
- Analyze correlations
- Generate visualizations
- Build dashboards
- Generate reports
- Manage user profiles
- Export analytical results

The application follows a layered architecture:

```text
┌─────────────────────────────────────────────┐
│                  CLIENT                     │
│                                             │
│       HTML + CSS + JavaScript               │
│       Chart.js + Plotly.js                  │
└─────────────────────┬───────────────────────┘
                      │
                      │ HTTP / REST API
                      ▼
┌─────────────────────────────────────────────┐
│               FLASK API                     │
│                                             │
│  Routes → Middleware → Services → Models    │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│              BUSINESS LOGIC                 │
│                                             │
│ Authentication                              │
│ Dataset Processing                          │
│ Data Analysis                               │
│ Visualization                               │
│ Dashboard Management                        │
│ Report Generation                            │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│                 DATABASE                    │
│                                             │
│                   MySQL                     │
└─────────────────────────────────────────────┘
                         VELOCITY BI
                              │
             ┌────────────────┴────────────────┐
             │                                 │
             ▼                                 ▼
       Frontend Client                    Backend Server
             │                                 │
       HTML/CSS/JS                        Flask REST API
             │                                 │
             │                    ┌────────────┼────────────┐
             │                    │            │            │
             │                    ▼            ▼            ▼
             │                 Routes      Middleware    Services
             │                                  │            │
             │                                  │            ▼
             │                                  │         Models
             │                                  │            │
             └──────────────────────────────────┼────────────┘
                                                │
                                                ▼
                                             MySQL
                                                │
                                                ▼
                                          Data Storage

