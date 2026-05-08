export const TOTAL_QUESTIONS = 105;

const yno = (num, text, { required = true } = {}) => ({
  num,
  type: "yesNoOther",
  text,
  required,
});

const text = (num, textLabel, { required = true, placeholder = "" } = {}) => ({
  num,
  type: "text",
  text: textLabel,
  required,
  placeholder,
});

const textarea = (
  num,
  textLabel,
  { required = true, placeholder = "", rows = 3 } = {},
) => ({
  num,
  type: "textarea",
  text: textLabel,
  required,
  placeholder,
  rows,
});

const time = (num, textLabel, { required = true } = {}) => ({
  num,
  type: "time",
  text: textLabel,
  required,
});

const date = (num, textLabel, { required = true } = {}) => ({
  num,
  type: "date",
  text: textLabel,
  required,
});

const select = (num, textLabel, options, { required = true } = {}) => ({
  num,
  type: "select",
  text: textLabel,
  required,
  options,
});

const checklist = (num, title, items, { required = true, hasOther = false } = {}) => ({
  num,
  type: "checklist",
  text: title,
  required,
  items,
  hasOther,
});

export const SECTIONS = [
  {
    id: "sec1",
    shortTitle: "Pre-Trial Departure",
    title: "Pre-Trial Departure Checklist",
    desc: 'Opening section — captures trial identity and departure readiness. Use "Other" to note anything not covered by the checklist.',
    questions: [
      checklist(
        1,
        "Electronics Readiness",
        [
          "Battery charged & in flight case",
          "No damages noticed on any components, wirings, or wire management equipment",
          "Electronics disassembly complete",
          "Electronics toolkit complete & in flight case",
        ],
        { required: true, hasOther: true },
      ),
      checklist(
        2,
        "Mechanical Readiness",
        [
          "All assembly fasteners known and available",
          "No damage on any of the body, arms or chassis",
          "Wheel wear usable",
          "Mechanical toolkit complete & in flight case",
          "Disassembly & case fitment complete",
          "Flight case undamaged & locked",
        ],
        { required: true, hasOther: true },
      ),
      checklist(3, "Software & Compute Readiness", [
        "System boot verified",
        "All sensor streams verified",
        "Data logging working",
        "Storage path verified",
        "Network working",
        "Storage space sufficient",
      ]),
      textarea(4, "Mechanical Agenda", { required: false, placeholder: "Enter agenda...", rows: 2 }),
      textarea(5, "Electronics Agenda", { required: false, placeholder: "Enter agenda...", rows: 2 }),
      textarea(6, "Robotics Software Agenda (ROS + DevOps + FSD)", {
        required: false,
        placeholder: "Enter agenda...",
        rows: 2,
      }),
      textarea(7, "ML Agenda", { required: false, placeholder: "Enter agenda...", rows: 2 }),
      checklist(
        8,
        "Readiness – Pre Departure",
        [
          "Flight case / transport box ready",
          "Loading completed & verified",
          "Trial permission documents",
          "Vehicle Arrangement",
          "Weather Check",
          "2x DC copy",
          "Water & snacks procured",
        ],
      ),
      checklist(9, "Safety & PPE", [
        "Helmets available",
        "Reflective jackets available",
        "Safety shoes available",
        "First aid kit available",
      ]),
      time(10, "Robot Disassembly start time"),
      time(11, "Robot Disassembly end time"),
      time(12, "Robot loading time"),
      time(13, "Robot departure time"),
    ],
  },
  {
    id: "sec2",
    shortTitle: "Pre-Trial Checks",
    title: "Pre-Trial Checks",
    desc: "All pre-trial operational checks go here. Every item should be marked before the form moves ahead.",
    questions: [
      text(27, "Battery 1 SoC", { placeholder: "e.g. 85%", required: true }),
      text(28, "Battery 2 SoC", { placeholder: "e.g. 90%", required: true }),
      {
        num: 29,
        type: "yesOther",
        text: "Check Wi-Fi connectivity and network stability",
        required: true,
        yesLabel: "Yes",
        otherLabel: "Other",
      },
      ...[
        [30, "Verify that all sensor cables are securely connected"],
        [31, "Confirm that all sensors are properly detected by the MCU"],
        [32, "Validate that all sensor data pipeline are functioning correctly"],
        [33, "Check that sufficient storage space is available on the recording device"],
        [34, "Verify synchronization of all system timestamps (need to verify)"],
        [35, "Confirm camera exposure and brightness settings are within acceptable limits"],
        [36, "Ensure all sensor mounts and mechanical fixtures are firmly secured"],
        [37, "Verify that all mechanical and electronic tools, components, and spares are accounted for"],
        [38, "Verify Mech-Mind parameters (after parameter get fix we can auto check it)"],
        [39, "Profilers' connectivity verified in SDK"],
        [40, "IP address verified in Mech-Mind SDK"],
        [41, "IP address verified in data acquisition script"],
        [42, "SDK IP and data acquisition code IP match"],
        [43, "Profiler angle set to 20° and data quality verified"],
        [44, "Encoder signals received in Mech-Mind SDK"],
        [45, "Test trigger executed successfully"],
        [46, "Camera positioned exactly on central FOV of rail head"],
        [47, "Camera orientation aligned with rail direction"],
      ].map(([n, t]) => yno(n, t)),
      textarea(48, "Pre-Trial Remarks", { required: true, placeholder: "Enter remarks...", rows: 3 }),
      text(49, "Final Pre-Trial Verification Approved By", {
        required: true,
        placeholder: "Name of approver",
      }),
    ],
  },
  {
    id: "sec3",
    shortTitle: "Trial Information",
    title: "Trial Information",
    desc: "Captures identity of the trial. Should always be mandatory before moving ahead.",
    questions: [
      select(
        14,
        "Trial Type",
        [
          { value: "", label: "Select trial type" },
          { value: "pune", label: "Pune (Test track)" },
          { value: "live", label: "Live Track" },
          { value: "other", label: "Other" },
        ],
        { required: true },
      ),
      text(15, "Block/PTW Number", { required: true, placeholder: "Enter block or PTW number" }),
      date(16, "Block Date", { required: true }),
      text(17, "Block Location", { required: true, placeholder: "Enter location" }),
      text(18, "ERICR POC Name", { required: true, placeholder: "Enter name" }),
      text(19, "PSU POC Name", { required: true, placeholder: "Enter name" }),
      time(20, "Reaching Time", { required: true }),
      textarea(21, "Team member names", {
        required: true,
        placeholder: "List all team members",
        rows: 2,
      }),
      time(22, "Robot unloading time", { required: true }),
      time(23, "Assembly Start Time", { required: true }),
      time(24, "Assembly End Time", { required: true }),
      time(25, "Robot placement on track time", { required: true }),
      time(26, "Movement start time", { required: true }),
    ],
  },
  {
    id: "sec4",
    shortTitle: "Trial Execution",
    title: "Trial Execution Checks",
    desc: "This section is filled during the trial or immediately after each segment.",
    questions: [
      yno(50, "Log start and end times of each trial segment"),
      text(51, "Monitor robot battery voltage and current throughout the trial", {
        required: true,
        placeholder: "Enter voltage/current readings",
      }),
      ...[
        [52, "Observe diagnostics monitor continuously for topic health"],
        [53, "Verify continuous data transmission from all sensors to the MCU/host PC"],
        [54, "Check for any communication dropouts or ROS2 node disconnections"],
        [55, "Confirm completion of the specific objective mentioned at the top"],
        [56, "Ensure that all data acquisition tools are operational"],
        [57, "Verify that IMU readings are stable"],
        [58, "Confirm GPS maintains a good satellite lock"],
        [59, "Monitor data file size and ensure there is no disk overflow"],
        [60, "Observe robot movement for smooth operation"],
        [61, "Check that obstacle detection and safety mechanisms are active"],
        [62, "Verify that the track and area ahead of the robot are clear"],
        [63, "Document any observed issues, warnings, restarts, or unusual behavior"],
        [64, "Mech-Mind profiler streaming live data continuously"],
        [65, "No profiler disconnection during motion"],
        [66, "RGB camera stream running without publish rate drop"],
        [67, "Profiler intensity and depth data updating correctly"],
        [68, "LiDAR data streaming continuously"],
        [69, "System CPU and memory usage within safe limits"],
        [70, "SDK warnings or errors monitored during run"],
        [71, "Trial start and stop timestamps noted"],
        [72, "Any anomaly observed during trial logged immediately"],
      ].map(([n, t]) => yno(n, t)),
      textarea(73, "Key Observation", {
        required: true,
        placeholder: "Describe key observations during the trial...",
        rows: 3,
      }),
      text(74, "Final Trial Execution Verification Approved By", {
        required: true,
        placeholder: "Approver name",
      }),
    ],
  },
  {
    id: "sec5",
    shortTitle: "Post-Trial Checks",
    title: "Post-Trial Checks",
    desc: "This section closes the trial-level validation before the BOT → REPORT phase starts.",
    questions: [
      ...[
        [75, "Confirm that all sensor data was recorded completely without interruption"],
        [76, "Verify that all bag files are saved and not corrupted"],
        [77, "Validate file sizes and ensure data duration matches the trial duration"],
        [78, "Confirm the correct file naming convention"],
        [79, "Log the total recording size and number of bag files generated"],
      ].map(([n, t]) => yno(n, t)),
      text(80, "File size number", { required: true, placeholder: "e.g. 12.4 GB" }),
      ...[
        [81, "Power down sensors and MCU safely"],
        [82, "Shut down the onboard computer/laptop properly"],
        [83, "Disconnect and store all sensor and power cables neatly"],
        [84, "Inspect sensors and mounts for any damage or loosening after the run"],
        [85, "Check robot's mechanical and electrical components for overheating or wear"],
      ].map(([n, t]) => yno(n, t)),
      text(86, "Check battery 1st voltage and percentage", {
        required: true,
        placeholder: "e.g. 24.3V / 72%",
      }),
      text(87, "Check battery 2nd voltage and percentage", {
        required: true,
        placeholder: "e.g. 24.1V / 68%",
      }),
      ...[
        [88, "RGB camera data sanity verified (Will look after office)"],
        [89, "Corresponding profiler point cloud data verified for each intensity (Needs explanation)"],
        [90, "Size of individual data folders verified for profilers (Office)"],
        [91, "Total number of PCDs verified for each folder (Office)"],
        [92, "Timestamps of corresponding PCDs across folders verified (Need explanation)"],
      ].map(([n, t]) => yno(n, t)),
      time(93, "Disassembly Start time", { required: true }),
      time(94, "Disassembly Complete time", { required: true }),
      text(95, "Ensure all boxes are packed (A-arm, Sensor, Robot, Battery)", {
        required: true,
        placeholder: "Confirmation note...",
      }),
      yno(96, "Confirm that no equipment has been left behind at the site"),
      yno(97, "Obtain supervisor or engineer approval for trial completion"),
      time(98, "Vehicle loading time", { required: true }),
      time(99, "Robot departure time from trial location", { required: true }),
      textarea(100, "Key Points / Remark", {
        required: true,
        placeholder: "Enter key points or remarks...",
        rows: 3,
      }),
      text(101, "Final Post-Trial Verification Approved By", {
        required: true,
        placeholder: "Approver name",
      }),
      time(102, "Robot arrive time in office", { required: false }),
      yno(103, "Check any part is damaged or loose"),
      yno(104, "Clean all sensors (Office)"),
      time(105, "Team office leaving time", { required: true }),
    ],
  },
];

export function getAllQuestions() {
  return SECTIONS.flatMap((s) => s.questions).sort((a, b) => a.num - b.num);
}

