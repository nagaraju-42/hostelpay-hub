$ErrorActionPreference = "Stop"

# Setup git user if needed
git config user.email "bot@hostelpayhub.com"
git config user.name "HostelPay Bot"

# Branch 1
git checkout -b feature/student-leaving
git add "src/app/(dashboard)/dashboard/export/page.tsx" "src/app/(dashboard)/dashboard/students/[id]/page.tsx" "src/app/api/export/payments/route.ts" "src/app/api/students/[id]/route.ts" "src/types/index.ts"
git commit -m "feat: Add student leaving date and export support"
git checkout main
git merge feature/student-leaving --no-edit

# Branch 2
git checkout -b feature/student-contact-owner
git add "src/app/(student)/s/dashboard/page.tsx" "src/app/(student)/s/page.tsx" "src/app/(student)/s/profile/page.tsx" "src/app/api/student/join/route.ts" "src/app/api/student/me/route.ts" "src/app/api/student/payments/route.ts"
git commit -m "feat: Add contact owner buttons and student profile enhancements"
git checkout main
git merge feature/student-contact-owner --no-edit

# Branch 3
git checkout -b fix/middleware-and-auth
git add "src/middleware.ts" "src/app/auth/callback/route.ts" "src/app/api/student/phone-login/" "src/lib/auth-student.ts" "src/lib/jwt.ts"
git commit -m "fix: Update middleware and student authentication flow"
git checkout main
git merge fix/middleware-and-auth --no-edit

# Branch 4
git checkout -b feature/support-system
git add "src/app/admin/layout.tsx" "src/app/admin/page.tsx" "src/app/admin/support/" "src/app/api/support/" "src/app/support/" "src/components/admin/AdminLogoutButton.tsx"
git commit -m "feat: Implement comprehensive support ticket system"
git checkout main
git merge feature/support-system --no-edit

# Branch 5
git checkout -b chore/misc-updates
git add package.json package-lock.json test-ticket.ts
git commit -m "chore: Update dependencies and add test script"
git checkout main
git merge chore/misc-updates --no-edit

Write-Host "All branches created and merged successfully!"
