# React plus Node/Express plus Azure SQL, served as a single app

For an assignment that is focused on Microsoft Azure, the obvious path is ASP.NET Core with Entity Framework, which is the most Azure native option. We chose React plus Node/Express with Azure SQL instead. The reason is that the team already built a polished React gem storefront (called "Gemz") whose components and design language we want to reuse for the ERP screens, and the team writes JavaScript, not C#. In a 4 day sprint, reusing the existing React work and staying in one language is worth more than the small extra Azure fit that .NET would give.

The Express server does two jobs. It serves the built React admin app, and it exposes the REST endpoints under /api. Because both come from the same server, the whole system deploys as one Azure App Service. There is no CORS to configure, no second host, and no server side rendering setup. This is the lowest risk way to still have a real backend and a real database, which protects the Azure Deployment marks (3) and the Database marks (2).

We kept Azure SQL, and did not use Cosmos DB or MongoDB, because the assignment brief names Azure SQL Database directly, and the marks reward relational database functionality.

## Considered options

- ASP.NET Core plus EF Core plus Azure SQL. This is the most Azure native and would give the best possible Azure and database marks, but it needs C# skills and a full rebuild of the UI, so it throws away the React storefront.
- Next.js plus Prisma plus Azure SQL. This is one clean codebase and reuses React, but Next.js server side rendering on Azure App Service has setup issues that can waste time in a short sprint.
