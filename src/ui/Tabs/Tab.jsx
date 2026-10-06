/* eslint-disable no-nested-ternary */
import React from 'react';
import { CircleCheck } from 'lucide-react';
import styles from './Tabs.module.scss';

const Tab = ({
  name, label, isActive, onClick, isDisabled, isCompleted,
}) => {
  const tabClass = isActive
    ? styles.active
    : styles.inactive;

  return (
    <div
      name={name}
      className={`${styles.tab} ${tabClass}`}
      onClick={!isDisabled ? onClick : null}
    >
      {isCompleted && <CircleCheck className="mr-2" />}
      {label}
    </div>
  );
};

export default Tab;
