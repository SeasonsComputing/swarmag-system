/**
 * swarmAg Administration Application
 */

// bootstrap -- must be first
import { bootstrap, rootRoute } from '@ux/common/shell/bootstrap.tsx'

// shell bindings
import { createRoute } from '@tanstack/solid-router'
import { UsersForm } from '@ux/app-admin/users/users-form.tsx'
import { AuthGuard } from '@ux/common/shell/auth-guard.tsx'
import { Content } from '@ux/common/shell/content.tsx'
import dashboardSeed from './dashboard-admin.json' with { type: 'json' }

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  component: () => (
    <AuthGuard>
      <Content>
        <UsersForm />
      </Content>
    </AuthGuard>
  )
})

void bootstrap(dashboardSeed, [usersRoute])
