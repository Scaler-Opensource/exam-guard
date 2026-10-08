# exam-guard
AI Proctoring tool developed by Scaler

Published on npm as [`@exam_guard/core`](https://www.npmjs.com/package/@exam_guard/core) (formerly `exam-guard`, which no longer receives releases).

## Releasing

Releases are published by GitHub Actions (`.github/workflows/release.yml`) using npm trusted publishing, so no npm token is stored.

1. On an up-to-date `main`, run `npm run release:patch` (or `release:minor` / `release:major`). This bumps the version, commits, tags `vX.Y.Z` and pushes.
2. The tag triggers the workflow: it checks the tag matches `package.json`, runs `npm ci && npm run build`, and publishes with provenance. Pre-release versions (`10.1.0-rc.1`) go to the `next` dist-tag, not `latest`.
3. Consumers load it from jsDelivr: `https://cdn.jsdelivr.net/npm/@exam_guard/core@<version>/dist/proctor.js`.

# Instructions for installation

Clone the repository

```
https://github.com/Scaler-Opensource/exam-guard.git
```

Run NPM install
```
npm i
```

**For development:**
Run webpack dev server
```
npm run start
```

You will see the following screen on running the server.

<img width="959" alt="image" src="https://github.com/user-attachments/assets/7ee34101-33a5-4b2d-a69f-11f9605e97ab">

**For production:**

To create the final build
```
npm run build
```



## Features

Features can be divided to:

-   AI Proctoring features
    
-   Non AI Proctoring features
    

**Non-AI Proctoring Features**

1.  Disable Copy Paste
    
2.  Disable Right Click
    
3.  Disable Tab Switch
    
4.  Disable Exit (Closing the tab)
    
5.  Disable Keyboard shortcuts
    
6.  Disable Text selections
    
7.  Disable Full Screen
    
8.  Disable Browser Window Switch
    
9.  Take Screenshot of the page in intervals
    
10.  Take webcam snapshot of the user in intervals
    

**Note:** Will also track the above proctoring events. We’ll add an event handler for tracking as well

**AI proctoring features** (To be Done)

All the features mentioned below uses the webcam snapshot taken.

-   Object Detection
    
-   Multiple Face detection
    
-   Eye Tracking
    

## Frameworks/Libraries/Tools used

-   **Webpack:** Build tool
    
-   **NPM:** Package manager
    
-   **JSDelivr**: Free CDN service for hosting and delivering files from npm (Needed for apps for which we can’t use npm packages)
    

### Common Configuration Options for Violations

Each violation in the proctoring library can be customized using the following common configuration properties:

-   **enabled** (boolean): Specifies whether the violation detection is active. Default is true.
    
-   **showAlert** (boolean): Controls whether an alert should be shown when the violation occurs. Default is true.
    
-   **recordViolation** (boolean): Indicates whether to log the violation event. Default is true.
    

These settings can be overridden for each individual violation as needed.

### Different Violations

1.  **Tab Switch Violation (**VIOLATIONS.tabSwitch)
    
    -   **Description**: Detects when the user switches from the current tab to another one.
        
2.  **Browser Blur Violation (**VIOLATIONS.browserBlur)
    
    -   **Description**: Detects when the browser window loses focus (e.g., user minimizes or switches to another app).
        
3.  **Right Click Violation (**VIOLATIONS.rightClick)
    
    -   **Description**: Detects when the user attempts to right-click within the application.
        
4.  **Exit Tab Violation (**VIOLATIONS.exitTab)
    
    -   **Description**: Detects when the user tries to exit or close the tab.
        
5.  **Copy-Paste-Cut Violation (**VIOLATIONS.copyPasteCut)
    
    -   **Description**: Detects when the user tries to copy, paste, or cut text within the application.
        
6.  **Restricted Key Event Violation (**VIOLATIONS.restrictedKeyEvent)
    
    -   **Description**: Detects when the user presses restricted keys (e.g., Ctrl+C, Ctrl+V, Ctrl+X, etc.).
        
7.  **Text Selection Violation (**VIOLATIONS.textSelection)
    
    -   **Description**: Detects when the user selects text within the application.
        
8.  **Fullscreen Violation (**VIOLATIONS.fullScreen)
    
    -   **Description**: Detects when the user exits fullscreen mode
        

### Violation Events Documentation

The proctoring library emits various events related to detected violations. Each event provides information about the type of violation and its details. Here's a breakdown of the events and associated methods for handling them:

#### 1. handleViolation(type, value = null, forceDisqualify = false)

-   **Purpose**: This method handles the detection of a violation by:
    
    -   Creating a violation object with the type, value, and timestamp.
        
    -   Showing a warning alert if configured.
        
    -   Recording the violation if configured.
        
    -   Dispatching a violation event.
        
    -   Checking if the user should be disqualified based on the violation count.
        
-   **Parameters**:
    
    -   type (string): The type of violation as defined in this.config.
        
    -   value (any, optional): Additional value or context associated with the violation.
        
    -   forceDisqualify (boolean, optional): If true, forces immediate disqualification regardless of the configured threshold.
        
-   **Behavior**:
    
    -   If alerts are enabled for the violation type, it displays a warning message.
        
    -   Records the violation if recording is enabled.
        
    -   Dispatches a violation event for further handling or logging.
        
    -   Checks if the user has reached the threshold for disqualification and disqualifies the user if needed.
        

#### 2. on(violationType, callback)

-   **Purpose**: This method allows the attachment of a callback function to a specific violation type event.
    
-   **Parameters**:
    
    -   violationType (string): The type of violation to listen for. It should match one of the configured violation types.
        
    -   callback (function): The function to be called when the violation event is triggered. Receives the total count of violations of the specified type and the event object.
        
-   **Behavior**:
    
    -   Adds an event listener for the specified violation type.
        
    -   Calls the provided callback function with the total count of violations of that type and the event object whenever the violation occurs.
        

#### 3. getTotalViolationsCountByType(type)

-   **Purpose**: Retrieves the total number of violations of a specific type.
    
-   **Parameters**:
    
    -   type (string): The type of violation to count.
        
-   **Returns**:
    
    -   (number): The count of violations of the specified type.
        
-   **Behavior**:
    
    -   Filters the list of recorded violations to count occurrences of the specified type.
        

#### 4. getTotalViolationsCount()

-   **Purpose**: Retrieves the total number of all recorded violations.
    
-   **Returns**:
    
    -   (number): The total count of all violations.
        
-   **Behavior**:
    
    -   Returns the length of the violationEvents array, representing the total number of recorded violations.
        

### Example Usage

-   **Handling a Specific Violation**:
    
    ```
    proctor.on('tabSwitch', (count, event) => { console.log(`Tab switch detected. Total violations: ${count}`); });
    ```
    
-   **Getting Total Violations Count**:
    
    ```
    const totalViolations = proctor.getTotalViolationsCount(); console.log(`Total violations: ${totalViolations}`);
    ```
    
-   **Handling and Forcing Disqualification**:
    
    ```
    proctor.handleViolation('tabSwitch', null, true);
    ```
    

### Compatibility Check

The compatibility check configuration ensures that the proctoring system verifies the user's environment to meet specific criteria. The configuration is used to perform various checks and manage their outcomes.

#### **Compatibility Check Configuration Options**

1.  enable (boolean):
    
    -   **Description**: Indicates whether compatibility checks are enabled.
        
    -   **Default**: true
        
2.  showAlert (boolean):
    
    -   **Description**: Controls whether an alert should be shown when a compatibility check fails.
        
    -   **Default**: true
        

#### **Compatibility Check Workflow**

1.  **Initialization**: When the proctoring system starts, it runs an initial compatibility check and sets an interval to repeat these checks every 20 seconds.
    
2.  **Checking**: The system performs the following checks:
    
    -   **Webcam**: Ensures that the webcam is accessible.
        
    -   **Network Speed**: Verifies if the network speed is adequate.
        
    -   **Fullscreen**: Checks if the application is running in fullscreen mode.
        
3.  **Handling Results**:
    
    -   **Success**: If all checks pass, a success callback is triggered.
        
    -   **Failure**: If any check fails, a failure callback is triggered, and a disqualification timer starts if needed.
        
4.  **Disqualification**:
    
    -   If a failure is detected and the compatibility check fails repeatedly, the user is disqualified after a predefined timeout period (15 seconds).
        

#### **Method Details**

1.  runCompatibilityChecks(onSuccess, onFailure)
    
    -   **Purpose**: Executes the compatibility checks and invokes the appropriate callback based on the result.
        
    -   **Parameters**:
        
        -   onSuccess (function): Callback function to handle successful checks.
            
        -   onFailure (function): Callback function to handle failed checks.
            
    -   **Example**:
        
        ```
        proctor.runCompatibilityChecks(
          (passedChecks) => {
            console.log('Compatibility checks passed:', passedChecks);
          },
          (failedCheck, passedChecks) => {
            console.log('Compatibility check failed:', failedCheck);
            console.log('Passed checks:', passedChecks);
          }
        );
        
        ```
        
2.  startCompatibilityChecks()
    
    -   **Purpose**: Begins running compatibility checks at regular intervals and handles their results.
        
    -   **Example**:
        
        ```
        proctor.startCompatibilityChecks(
          (passedChecks) => {
            console.log('Compatibility checks passed:', passedChecks);
          },
          (failedCheck, passedChecks) => {
            console.log('Compatibility check failed:', failedCheck);
            console.log('Passed checks:', passedChecks);
          }
        );
        
        ```
        
3.  stopCompatibilityChecks()
    
    -   **Purpose**: Stops ongoing compatibility checks and any associated timers.
        
    -   **Example**:
        
        ```
        proctor.stopCompatibilityChecks();
        ```
        

### Callback methods available

#### **1.** onDisqualified

-   **Description**: Triggered when the user is disqualified due to violating the proctoring rules.
    
-   **Parameters**: None.
    

#### **2.** onWebcamDisabled

-   **Description**: Called when the webcam is disabled or becomes unavailable.
    
-   **Parameters**: None.
    

#### **3.** onWebcamEnabled

-   **Description**: Called when the webcam is enabled or becomes available.
    
-   **Parameters**: None.
    

#### **4.** onSnapshotSuccess

-   **Description**: Invoked when a snapshot is successfully captured.
    
-   **Parameters**:
    
    -   snapshotData (object): Data related to the captured snapshot.
        

#### **5.** onSnapshotFailure

-   **Description**: Invoked when snapshot capturing fails.
    
-   **Parameters**:
    
    -   error (object): Error details related to the failure.
        

#### **6.** onScreenshotDisabled

-   **Description**: Triggered when screenshot functionality is disabled.
    
-   **Parameters**: None.
    

#### **7.** onScreenshotEnabled

-   **Description**: Triggered when screenshot functionality is enabled.
    
-   **Parameters**: None.
    

#### **8.** onScreenshotFailure

-   **Description**: Invoked when screenshot capturing fails.
    
-   **Parameters**:
    
    -   error (object): Error details related to the failure.
        

#### **9.** onScreenshotSuccess

-   **Description**: Invoked when a screenshot is successfully captured.
    
-   **Parameters**:
    
    -   screenshotData (object): Data related to the captured screenshot.
        

#### **10.** onFullScreenEnabled

-   **Description**: Called when the application enters fullscreen mode.
    
-   **Parameters**: None.
    

#### **11.** onFullScreenDisabled

-   **Description**: Called when the application exits fullscreen mode.
    
-   **Parameters**: None.
    

#### **12.** onCompatibilityCheckSuccess

-   **Description**: Triggered when compatibility checks pass successfully.
    
-   **Parameters**:
    
    -   passedChecks (object): Details of the passed compatibility checks.
        

#### **13.** onCompatibilityCheckFail

-   **Description**: Invoked when compatibility checks fail.
    
-   **Parameters**:
    
    -   failedCheck (string): Identifier of the failed check.
        
    -   passedChecks (object): Details of the compatibility checks that passed.
        

### Browser Compatibility

#### **Overview**

The proctoring library is bundled using Webpack 5.94.0, which is a powerful tool for managing and optimizing the bundle and its dependencies. Webpack handles many aspects of compatibility, but there are additional considerations for browser support, particularly for features like camera access and snapshot functionality.

The proctoring library is designed to work across modern browsers. However, to ensure broad compatibility and proper functionality, including camera and snapshot features, follow these guidelines:

1.  **Supported Browsers**:
    
    -   **Google Chrome**: Latest stable version and recent versions.
        
    -   **Mozilla Firefox**: Latest stable version and recent versions.
        
    -   **Safari**: Latest stable version and recent versions.
        
    -   **Microsoft Edge**: Latest stable version and recent versions.
        
2.  **Minimum Browser Requirements**:
    
    -   **Google Chrome**: Version 80+
        
    -   **Mozilla Firefox**: Version 80+
        
    -   **Safari**: Version 13+
        
    -   **Microsoft Edge**: Version 80+
        
3.  **Features and Support**:
    
    -   **Camera Access**: Uses the WebRTC API, which is widely supported in modern browsers but may have varying levels of support in older versions or less common browsers. Ensure permissions are granted for camera access.
        
    -   **Snapshot Functionality**: Relies on HTML5 Canvas for capturing snapshots. Most modern browsers support Canvas API, but ensure that your target browsers are updated.
        

## Expected Usage:

```
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proctoring Library Test</title>
</head>
<body>
  <h1>Proctoringss Library Test</h1>
  <!-- Image element to render the captured snapshot -->
  <div>
    <h2>Captured Snapshot:</h2>
    <img id="snapshot" alt="Snapshot will appear here" style="max-width: 100%; height: auto;" />
  </div>
  <div>
    <h2>Captured Screenshot:</h2>
    <img id="screenshot" alt="Screenshot will appear here" style="max-width: 100%; height: auto;" />
  </div>

  <!-- Include the Webpack bundle -->
  <!-- Pin an exact version in production; @latest can change under a running test. -->
  <script src="https://cdn.jsdelivr.net/npm/@exam_guard/core@10.0.5/dist/proctor.js"></script>

  <script>
    const proctor = new Proctor({
      eventsUrl: 'https://example.com/events', // Replace with your actual events URL
      config: {
        tabSwitch: {
          enabled: true,
          showAlert: true,
          recordViolation: true,
        },
      },
      enableAllAlerts: true,
      callbacks: {
        onSnapshotSuccess: ({ blob }) => {
          const snapshotImg = document.getElementById('snapshot');
          if (snapshotImg) {
            // Create a URL for the blob and set it as the src of the image element
            const imageUrl = URL.createObjectURL(blob);
            snapshotImg.src = imageUrl;
          }
        },
        onScreenshotSuccess: ({ blob }) => {
          const screenshotImg = document.getElementById('screenshot');
          if (screenshotImg) {
            // Create a URL for the blob and set it as the src of the image element
            const imageUrl = URL.createObjectURL(blob);
            screenshotImg.src = imageUrl;
          }
        }
      }
    });
    proctor.initializeProctoring();

    proctor.on('violation', (violations, event) => {
      console.log('%c⧭', 'color: #ffa640', 'Violation detected', violations, event.detail.type);
    });
  </script>
</body>
</html>
```
