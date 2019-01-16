// GLOBALS //

const blessed = require("blessed");
const { colorScheme } = require("../constants");

// MAIN //

module.exports.createNotificationModal = (
  screen,
  displayText,
  showButton = true,
  callback = modal => {}
) => {
  let notification = null;
  notification = blessed.form({
    parent: screen,
    keys: true,
    type: "overlay",
    top: "center",
    left: "center",
    width: 45,
    height: 8,
    bg: colorScheme.background,
    color: "white"
  });

  let label = blessed.box({
    parent: notification,
    top: 1,
    left: "center",
    width: 14,
    height: 1,
    content: displayText.label,
    style: { bg: colorScheme.background, fg: "white", bold: true },
    tags: true
  });

  let hint = blessed.box({
    parent: notification,
    top: 2,
    left: "center",
    width: 34,
    height: 3,
    shrink: true,
    content: displayText.hint,
    style: { bg: colorScheme.background, fg: "black" },
    tags: true
  });

  // Buttons
  if (showButton) {
    let okayButton = blessed.button({
      parent: notification,
      mouse: true,
      keys: true,
      shrink: true,
      right: 5,
      bottom: 1,
      padding: { left: 4, right: 4, top: 1, bottom: 1 },
      name: "okay",
      content: "okay",
      style: {
        bg: colorScheme.confirmLight,
        fg: "black",
        focus: { bg: colorScheme.confirmDark, fg: "black" },
        hover: { bg: colorScheme.confirmDark, fg: "black" }
      }
    });

    okayButton.on("press", () => notification.destroy());
    screen.key(["escape"], (ch, key) => notification.destroy());

    okayButton.focus();
  }

  notification.focus();
  screen.render();
  setTimeout(() => callback(notification), 2000);
};
