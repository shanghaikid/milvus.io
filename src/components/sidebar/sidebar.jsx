import React, { useState } from 'react';
import LocalizedLink from '../localizedLink/localizedLink';
import Menu from '../menu/index';
import * as styles from './sidebar.module.less';
import PropTypes from 'prop-types';
import Selector from '../selector';

const Sidebar = props => {
  const {
    locale,
    showSearch = true,
    showVersions = false,
    showMenu = true,
    menuConfig,
    searchConfig,
    versionConfig,
    wrapperClass = '',
    allApiMenus,
    isVersionWithHome = false,
  } = props;

  const { placeholder } = searchConfig || {};
  const { versions, version, homeTitle } = versionConfig || {};
  const {
    menuList,
    activePost,
    pageType,
    formatVersion,
    isBlog = false,
  } = menuConfig || {};

  const { menuList: menus } = (menuList &&
    menuList.find(menu => menu.lang === locale)) || {
    menuList: [],
  };

  const map = isVersionWithHome
    ? {
        en: `/docs/${version}`,
        cn: `/docs/${version}`,
      }
    : {
        en: `/docs/${version}/overview.md`,
        cn: `/docs/${version}/overview.md`,
      };
  const homePath = map[locale];

  const [mobileSidebarOpened, setMobileSidebarOpened] = useState(false);

  const onMaskClick = () => {
    setMobileSidebarOpened(false);
  };

  const toggleControl = () => {
    setMobileSidebarOpened(!mobileSidebarOpened);
  };

  return (
    <>
      <aside
        className={`${wrapperClass} ${styles.wrapper} ${
          !mobileSidebarOpened ? styles.hide : ''
        }`}
      >
        {showSearch && (
          <section className={styles.searchWrapper}>
            <input
              id="algolia-search"
              type="text"
              className={styles.search}
              placeholder={placeholder}
            />
          </section>
        )}
        {showVersions && (
          <section className={styles.versionWrapper}>
            <LocalizedLink
              className={styles.link}
              locale={locale}
              to={homePath}
            >
              {homeTitle}
            </LocalizedLink>
            <Selector
              className={styles.selector}
              options={versions}
              locale={locale}
              selected={version}
              isVersion={true}
            />
          </section>
        )}
        {showMenu && (
          <Menu
            locale={locale}
            menuList={menus}
            activePost={activePost}
            pageType={pageType}
            formatVersion={formatVersion}
            isBlog={isBlog}
            allApiMenus={allApiMenus}
            showSearch={showSearch}
            showVersions={showVersions}
          />
        )}
      </aside>
      <button
        className={
          mobileSidebarOpened
            ? `${styles.miniControl} ${styles.miniControlOpen}`
            : styles.miniControl
        }
        onClick={toggleControl}
      >
        {''}
      </button>
      {mobileSidebarOpened && (
        <div
          className={styles.mask}
          onClick={onMaskClick}
          role="presentation"
        ></div>
      )}
    </>
  );
};

Sidebar.propTypes = {
  locale: PropTypes.string.isRequired,
  showSearch: PropTypes.bool,
  showVersions: PropTypes.bool,
  showMenu: PropTypes.bool,
  menuConfig: PropTypes.object,
  // {versions, version, hometitle}
  versionConfig: PropTypes.object,
  searchConfig: PropTypes.object,
};

export default Sidebar;
