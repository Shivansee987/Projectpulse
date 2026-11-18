\# ProjectPulse



\### Intelligent Project Management \& Scheduling Platform



\*\*Plan smarter. Manage dependencies. Predict project timelines. Deliver with confidence.\*\*



ProjectPulse is a modern project management platform designed to simplify project planning, task coordination, dependency management, and schedule tracking.



The platform aims to help project managers and teams gain better visibility into project progress through intelligent scheduling, Critical Path analysis, what-if simulations, risk assessment, and AI-powered insights.



\---



\## Project Overview



Managing complex projects involves coordinating multiple tasks, tracking dependencies, monitoring deadlines, and identifying potential delays.



ProjectPulse aims to bring these capabilities together in one centralized platform, helping teams make informed decisions and manage project timelines more effectively.



\## Key Features



\### Current Implementation



\- \*\*Interactive Dashboard\*\* – Centralized project overview with dashboard cards and widgets.

\- \*\*Analytics Interface\*\* – Dedicated analytics page for project-related information.

\- \*\*Project Management Interface\*\* – Structured project overview and navigation.

\- \*\*Task Management Interface\*\* – Dedicated task management page.

\- \*\*Dependency Visualization\*\* – Dependency graph interface for understanding task relationships.

\- \*\*Navigation System\*\* – Organized sidebar and application routing.

\- \*\*Backend Foundation\*\* – Express.js application architecture with authentication module structure.

\- \*\*Database Integration\*\* – PostgreSQL database connected through Neon and Prisma ORM.



\### Planned Capabilities



\- Secure user registration and authentication.

\- JWT-based authorization and protected routes.

\- Complete Project and Task CRUD operations.

\- Automated project scheduling using Critical Path Method (CPM).

\- Forward Pass and Backward Pass calculations.

\- Earliest Start, Latest Start, and Slack calculations.

\- Critical Path identification and visualization.

\- What-if simulation for task duration changes.

\- Project delay and risk analysis.

\- AI-powered project insights and recommendations.



\---



\## Technology Stack



| Technology | Purpose |

|---|---|

| JavaScript | Application development |

| Node.js | Backend runtime |

| Express.js | Backend framework |

| PostgreSQL | Relational database |

| Neon | Cloud database hosting |

| Prisma ORM | Database schema and client management |

| Git | Version control |

| GitHub | Source code hosting |



\---



\## System Architecture



ProjectPulse follows a frontend-backend architecture.



```text

&#x20;                PROJECTPULSE

&#x20;                     |

&#x20;         +-----------+-----------+

&#x20;         |                       |

&#x20;     FRONTEND                 BACKEND

&#x20;         |                       |

&#x20;    Dashboard                 Express.js

&#x20;    Analytics                     |

&#x20;    Projects                 API Routes

&#x20;    Tasks                         |

&#x20;    Dependency Graph         Controllers

&#x20;                                 |

&#x20;                             Prisma ORM

&#x20;                                 |

&#x20;                          PostgreSQL (Neon)

```



The architecture is designed to support future scheduling, simulation, analytics, and AI services.



\---



\## Project Structure



```text

ProjectPulse/

│

├── client/

│   └── Frontend application

│

├── server/

│   ├── prisma/

│   │   └── schema.prisma

│   │

│   ├── src/

│   │   ├── controllers/

│   │   │   └── auth.controller.js

│   │   │

│   │   ├── routes/

│   │   │   └── auth.routes.js

│   │   │

│   │   └── app.js

│   │

│   ├── .env

│   └── package.json

│

├── README.md

└── .gitignore

```



\---



\## Database Design



ProjectPulse currently defines five primary Prisma models.



| Model | Responsibility |

|---|---|

| User | User account information |

| Project | Project details, ownership, and deadlines |

| Task | Task details, duration, and scheduling attributes |

| Dependency | Relationships between dependent tasks |

| Simulation | Task duration simulation records |



\*\*Database:\*\* PostgreSQL  

\*\*Hosting:\*\* Neon  

\*\*ORM:\*\* Prisma 6



\---



\## Getting Started



Follow these steps to set up the project locally.



\### Prerequisites



Make sure you have installed:



\- Node.js

\- npm

\- Git

\- A Neon PostgreSQL account or another PostgreSQL database



\### 1. Clone the Repository



```bash

git clone https://github.com/Shivansee987/Projectpulse.git

```



```bash

cd Projectpulse

```



\### 2. Set Up the Backend



```bash

cd server

npm install

```



\### 3. Configure Backend Environment Variables

Create a `.env` file inside the `server` directory:

```env
DATABASE_URL="YOUR_POSTGRESQL_CONNECTION_STRING"
JWT_SECRET="GENERATE_A_LONG_RANDOM_SECRET"
# Optional; defaults to 1d
JWT_EXPIRES_IN="1d"
# Optional; defaults to 5000
PORT=5000
```

Keep backend environment values private. Never commit `server/.env`, database credentials, or JWT secrets.

\### 4. Configure the Frontend API URL

Create `client/.env.local` using `client/.env.example` as a template. The local development value is:

```env
VITE_API_URL=http://localhost:5000/api
```

For deployment, set `VITE_API_URL` in the frontend build environment to the deployed backend API URL ending in `/api`. Vite embeds `VITE_*` values in browser assets, so this URL is public configuration; never put credentials or other secrets in it. If unset, local development uses the localhost fallback, while production builds require the variable to be set.

\### 5. Generate Prisma Client

```bash

npx prisma generate

```

\### 6. Synchronize the Database

```bash

npx prisma db push

```

\### 7. Run the Application

Run the backend and frontend in separate terminals from the repository root:

```bash
npm --prefix server run dev
```

```bash
npm --prefix client run dev
```



\---



\## Development Roadmap



ProjectPulse is actively under development.



\- \[x] Initial frontend project setup

\- \[x] Dashboard interface

\- \[x] Navigation and routing structure

\- \[x] Analytics, Projects, and Tasks interfaces

\- \[x] Dependency graph interface

\- \[x] Express.js backend foundation

\- \[x] Authentication module structure

\- \[x] Prisma schema implementation

\- \[x] Neon PostgreSQL integration

\- \[x] Database schema synchronization

\- \[ ] Complete registration and login functionality

\- \[ ] Password hashing and JWT authentication

\- \[ ] Protected API routes

\- \[ ] Project CRUD APIs

\- \[ ] Task CRUD APIs

\- \[ ] CPM scheduling engine

\- \[ ] Critical Path calculation

\- \[ ] What-if simulation engine

\- \[ ] Risk analysis engine

\- \[ ] AI-powered project insights

\- \[ ] Frontend-backend integration

\- \[ ] Application testing

\- \[ ] Production deployment



\---



\## Security Considerations



Security is an important part of the ProjectPulse development process.



Planned security measures include:



\- Password hashing using bcrypt.

\- JWT-based authentication.

\- Protected backend endpoints.

\- Environment-based configuration.

\- Secure database credential management.

\- Input validation and error handling.



\---



\## Future Vision



ProjectPulse aims to evolve into an intelligent project planning and decision-support platform.



Future development will focus on combining project scheduling algorithms, dependency analysis, simulation capabilities, and AI-driven recommendations to help teams identify potential delays and improve project delivery.



\---



\## Repository



\*\*GitHub:\*\* \[Shivansee987/Projectpulse](https://github.com/Shivansee987/Projectpulse)



\*\*Project Name:\*\* ProjectPulse  

\*\*Category:\*\* Project Management / Scheduling  

\*\*Development Status:\*\* In Progress



\---



\## License



A license has not yet been specified for this repository.



\---



<div align="center">



\### ProjectPulse



\*\*Plan Smarter. Track Better. Deliver Faster.\*\*



\*Built to make project planning more intelligent.\*



</div>

