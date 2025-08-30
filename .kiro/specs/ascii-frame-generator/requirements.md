# Requirements Document

## Introduction

This feature involves creating a Next.js 15 web application that allows users to upload short videos (10-15 seconds, up to 25MB) and convert them into ASCII art frames. The application will extract video frames using ffmpeg.wasm, convert each frame to ASCII art using logic inspired by Ghostty's video-to-terminal script, and package the results into a downloadable ZIP file. The entire process is ephemeral with no data persistence after job completion. The UI will be minimalist using TailwindCSS default styling.

## Requirements

### Requirement 1

**User Story:** As a user, I want to upload a short video file, so that I can convert it to ASCII art frames.

#### Acceptance Criteria

1. WHEN a user selects a video file THEN the system SHALL accept MP4 and WebM formats only
2. WHEN a user uploads a video longer than 15 seconds THEN the system SHALL reject the file with an error message
3. WHEN a user uploads a video larger than 25MB THEN the system SHALL reject the file with an error message
4. WHEN a video is being uploaded THEN the system SHALL display upload progress to the user
5. WHEN a valid video is uploaded THEN the system SHALL enable the settings panel and processing options

### Requirement 2

**User Story:** As a user, I want to configure ASCII conversion settings, so that I can customize the output according to my preferences.

#### Acceptance Criteria

1. WHEN the settings panel is displayed THEN the system SHALL provide frame rate options (12 FPS, 24 FPS)
2. WHEN the settings panel is displayed THEN the system SHALL provide resolution scaling options (50%, 75%, 100%)
3. WHEN the settings panel is displayed THEN the system SHALL provide character set selection (default ASCII or custom)
4. WHEN the settings panel is displayed THEN the system SHALL provide color mode options (Black & White, Two-tone with color picker, Full-color approximation)
5. WHEN the settings panel is displayed THEN the system SHALL provide background options (Transparent, Black, White)
6. WHEN a user selects two-tone color mode THEN the system SHALL display color pickers for selecting two colors
7. WHEN settings are changed THEN the system SHALL validate the configuration before allowing processing

### Requirement 3

**User Story:** As a user, I want the system to process my video using Ghostty-inspired logic, so that I get high-quality ASCII art conversion.

#### Acceptance Criteria

1. WHEN processing begins THEN the system SHALL use ffmpeg.wasm to extract frames at the specified FPS
2. WHEN extracting frames THEN the system SHALL resize frames according to the resolution scaling setting
3. WHEN converting frames to ASCII THEN the system SHALL use Manhattan distance in RGB color space for color thresholding
4. WHEN converting frames to ASCII THEN the system SHALL map pixels to ASCII characters based on the selected character set
5. WHEN processing color modes THEN the system SHALL apply the appropriate color conversion algorithm
6. WHEN processing is complete THEN the system SHALL package all ASCII frames into a ZIP file with JSZip
7. WHEN creating the ZIP THEN the system SHALL include a README.md file with usage instructions

### Requirement 4

**User Story:** As a user, I want to see processing progress and download my results, so that I know when my conversion is complete and can access the output.

#### Acceptance Criteria

1. WHEN processing starts THEN the system SHALL display a progress bar showing conversion status
2. WHEN processing is in progress THEN the system SHALL show which frame is currently being processed
3. WHEN processing completes successfully THEN the system SHALL display a download button
4. WHEN the download button is clicked THEN the system SHALL provide the ZIP file for download
5. WHEN processing fails THEN the system SHALL display an error message with details
6. WHEN a job is complete THEN the system SHALL clean up all temporary files and data

### Requirement 5

**User Story:** As a user, I want to preview ASCII frames during processing, so that I can see the conversion quality in real-time.

#### Acceptance Criteria

1. WHEN frames are being converted THEN the system SHALL display a preview of the current ASCII frame
2. WHEN the preview is shown THEN the system SHALL maintain the aspect ratio of the original frame
3. WHEN displaying ASCII frames THEN the system SHALL use monospace font for proper character alignment
4. WHEN color modes are applied THEN the system SHALL preview frames with the selected color scheme

### Requirement 6

**User Story:** As a user, I want to access documentation on how to use the generated ASCII frames, so that I can implement them in my projects.

#### Acceptance Criteria

1. WHEN accessing the /docs page THEN the system SHALL provide comprehensive usage documentation
2. WHEN viewing documentation THEN the system SHALL include JavaScript code examples for frame playback
3. WHEN viewing documentation THEN the system SHALL explain different display methods and timing controls
4. WHEN viewing documentation THEN the system SHALL provide examples of HTML structure for frame display
5. WHEN viewing documentation THEN the system SHALL include performance optimization tips

### Requirement 7

**User Story:** As a user, I want a clean and minimalist interface, so that I can focus on the conversion process without distractions.

#### Acceptance Criteria

1. WHEN the application loads THEN the system SHALL display a minimalist layout using TailwindCSS default colors
2. WHEN displaying the interface THEN the system SHALL use clean typography (Inter font family)
3. WHEN rendering UI elements THEN the system SHALL avoid gradients and heavy shadows
4. WHEN displaying the layout THEN the system SHALL include Header (Logo + Docs link), Main (Upload → Settings → Progress → Download), and Footer (minimal copy + GitHub link)
5. WHEN using colors THEN the system SHALL stick to neutral grays and whites from TailwindCSS default palette

### Requirement 8

**User Story:** As a developer, I want the system to handle all processing ephemerally, so that no user data persists after job completion.

#### Acceptance Criteria

1. WHEN a processing job starts THEN the system SHALL store temporary data only in memory or temporary storage
2. WHEN a job completes successfully THEN the system SHALL automatically delete all temporary files
3. WHEN a job fails THEN the system SHALL clean up any partial data or temporary files
4. WHEN a timeout occurs THEN the system SHALL automatically clean up expired job data
5. IF temporary storage is used THEN the system SHALL implement automatic cleanup after a maximum of 1 hour

### Requirement 9

**User Story:** As a developer, I want to properly attribute the Ghostty project, so that I comply with the MIT license requirements.

#### Acceptance Criteria

1. WHEN using Ghostty-inspired logic THEN the system SHALL include the original MIT license notice in the codebase
2. WHEN displaying the application THEN the system SHALL provide attribution to the Ghostty project
3. WHEN packaging the final ZIP THEN the system SHALL include license attribution in the README.md file
4. WHEN deploying the application THEN the system SHALL maintain all required license notices