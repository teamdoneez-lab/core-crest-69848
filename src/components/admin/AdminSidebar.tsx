import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Package, List, Plus, Upload, Tag, Home, Gift } from 'lucide-react';

const menuItems = [
  {
    title: 'Overview',
    icon: Home,
    href: '/admin',
  },
  {
    title: 'DoneEZ Products',
    icon: Package,
    items: [
      { title: 'Product List', icon: List, href: '/admin/doneez/products' },
      { title: 'Add New Product', icon: Plus, href: '/admin/doneez/products/new' },
      { title: 'Bulk Upload', icon: Upload, href: '/admin/doneez/products/bulk-upload' },
      { title: 'Categories', icon: Tag, href: '/admin/doneez/categories' },
    ],
  },
  {
    title: 'Partner Offers',
    icon: Gift,
    href: '/admin/partner-offers',
  },
];

export function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 border-r bg-card min-h-screen p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Admin Panel</h2>
          <p className="text-sm text-muted-foreground">Manage your platform</p>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item, idx) => (
            <div key={idx}>
              {item.href ? (
                <Link
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    location.pathname === item.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-foreground">
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </div>
                  {item.items?.map((subItem) => (
                    <Link
                      key={subItem.href}
                      to={subItem.href}
                      className={cn(
                        'flex items-center gap-3 pl-10 pr-3 py-2 rounded-md text-sm transition-colors',
                        location.pathname === subItem.href
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <subItem.icon className="h-4 w-4" />
                      {subItem.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
