import alertHtml from '../templates/alert.html';
import warningIcon from '../assets/images/white-warning.svg';

export function closeModal(trigger = false) {
  const modal = document.getElementById('warning-modal');
  if (modal) {
    const isManualUserClick = trigger && (trigger.type === 'click' || trigger instanceof Event);

    if (isManualUserClick) {
      modal.style.display = 'none';
      return;
    }
    const fromNetworkCheck = trigger;
    const isNetworkModalActive = modal.classList.contains('warning-modal--networkAlert');
    if (fromNetworkCheck !== isNetworkModalActive) return;
    modal.style.display = 'none';
  }
}

export function setupAlert() {
  const alertContainer = document.createElement('div');
  alertContainer.innerHTML = alertHtml;
  document.body.appendChild(alertContainer);

  const closeButton = document.getElementById('warning-modal-close-btn');
  const actionButton = document.getElementById('warning-modal-action');
  const warningModalIcon = document.getElementById('warning-modal-icon');
  if (warningModalIcon) {
    warningModalIcon.src = warningIcon;
  }
  if (closeButton) {
    closeButton.addEventListener('click', closeModal);
  }

  if (actionButton) {
    actionButton.addEventListener('click', closeModal);
  }
}

export function showViolationWarning(heading, text, hideAction = false, networkAlert = false) {
  const modal = document.getElementById('warning-modal');
  const modalHeading = document.getElementById('warning-modal-heading');
  const modalText = document.getElementById('warning-modal-text');
  const modalAction = document.getElementById('warning-modal-action');

  if (modal && modalHeading && modalText && modalAction) {
    // Set new heading and text
    modalHeading.textContent = heading;
    modalText.textContent = text;

    modal.classList.remove('warning-modal--networkAlert');
    modal.style.display = 'none';
    if (networkAlert) {
      modal.classList.add('warning-modal--networkAlert');
    }

    // Display the modal
    modal.style.display = 'block';
    if (hideAction) {
      modalAction.style.display = 'none';
    } else {
      modalAction.style.display = 'block';
    }
  }
}
