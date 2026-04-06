'use client';

import { useState } from 'react';
import { Search, Bell, Plus, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import styles from './TopBar.module.css';

export default function TopBar() {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className={styles.topbar}>
      <div className={styles.searchWrapper}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search experiences, templates..."
          className={styles.searchInput}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        <kbd className={styles.kbd}>⌘K</kbd>
      </div>

      <div className={styles.actions}>
        <Link href="/studio" className={`btn btn-primary btn-sm ${styles.quickCreate}`}>
          <Plus size={16} />
          <span>New Experience</span>
        </Link>

        <button className={styles.iconBtn} aria-label="Notifications">
          <Bell size={20} />
          <span className={styles.notifDot} />
        </button>
      </div>
    </header>
  );
}
