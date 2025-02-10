import React from 'react';
import classNames from 'classnames';

import styles from './Tabs.module.scss';

const Tabs = ({
  children, activeTab, onTabChange, className,
}) => {
  const handleTabClick = (name) => {
    if (onTabChange) onTabChange(name);
  };

  return (
    <div className={classNames(styles.tabs, { [className]: className })}>
      <div className={styles.tabList}>
        {React.Children.map(children, (child) => React.cloneElement(child, {
          isActive: activeTab === child.props.name,
          onClick: () => handleTabClick(child.props.name),
        }))}
      </div>
      <div className={styles.tabContent}>
        {React.Children.toArray(children).find(
          (child) => child.props.name === activeTab,
        )?.props.children}
      </div>
    </div>
  );
};

export default Tabs;
