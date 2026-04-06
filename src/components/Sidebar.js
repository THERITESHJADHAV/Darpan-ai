'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Sparkles,
  Layers,
  LayoutTemplate,
  BarChart3,
  Settings,
  ChevronLeft,
  Zap,
  LogOut,
  HelpCircle,
} from 'lucide-react';
import styles from './Sidebar.module.css';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Sparkles, label: 'AI Studio', href: '/studio' },
  { icon: Layers, label: 'My Experiences', href: '/experiences' },
  { icon: LayoutTemplate, label: 'Templates', href: '/templates' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
];

const bottomItems = [
  { icon: HelpCircle, label: 'Help & Docs', href: '#' },
  { icon: Settings, label: 'Settings', href: '#' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      {/* Brand */}
      <div className={styles.brand}>
        <div className={styles.logoIcon}>
          <Zap size={22} />
        </div>
        {!collapsed && (
          <div className={styles.brandText}>
            <span className={styles.brandName}>CXP</span>
            <span className={styles.brandSub}>Content → Experience</span>
          </div>
        )}
        <button
          className={styles.collapseBtn}
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle sidebar"
        >
          <ChevronLeft size={16} className={collapsed ? styles.rotated : ''} />
        </button>
      </div>

      {/* Create Button */}
      <div className={styles.createSection}>
        <Link href="/studio" className={`${styles.createBtn} ${collapsed ? styles.createBtnCollapsed : ''}`}>
          <Sparkles size={18} />
          {!collapsed && <span>Create Experience</span>}
        </Link>
      </div>

      {/* Main Nav */}
      <nav className={styles.nav}>
        <div className={styles.navGroup}>
          {!collapsed && <div className={styles.navLabel}>Main</div>}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={20} />
                {!collapsed && <span>{item.label}</span>}
                {isActive && <div className={styles.activeIndicator} />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom */}
      <div className={styles.bottom}>
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.href} className={styles.navItem} title={collapsed ? item.label : undefined}>
              <Icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
        <div className={styles.divider} />
        <div className={styles.userCard}>
          <div className={styles.userAvatar}>R</div>
          {!collapsed && (
            <div className={styles.userInfo}>
              <span className={styles.userName}>Ritesh</span>
              <span className={styles.userRole}>Creator</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
