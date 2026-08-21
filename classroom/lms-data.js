window.NAV_CLASSROOM = {
  course: {
    id: "hard-to-kill",
    title: "Hard to Kill",
    subtitle: "The Science of Natural Strength, Muscle, Power, and Longevity",
    academicTitle: "Integrated Science of Natural Strength, Hypertrophy, Power, and Lifelong Resilience",
    length: "10 weeks",
    weeklyHours: "About 12–12.5 hours in the university-format version",
    reasoningLoop: ["Assess", "Explain", "Prescribe", "Monitor", "Adjust", "Refer"],
    sourceVersion: "NAV Human Performance — University-Ready Curriculum v3 · August 2026"
  },
  weeks: [
    {
      week: 1,
      title: "Define the Outcome",
      essentialQuestion: "What does it mean to become stronger, more muscular, more powerful, better conditioned, and more resilient?",
      hours: "~12 hours",
      topics: ["What is strength?", "Strength vs muscle size", "Power and work capacity", "External vs internal load", "Measurement validity", "Evidence and claims"],
      quiz: {
        id: "quiz-1",
        title: "Foundations of Human Performance",
        question: "Which statement best reflects how NAV treats performance outcomes?",
        options: ["Strength, hypertrophy, power, and conditioning are interchangeable labels.", "Each outcome is related to the others but should be defined and measured separately.", "Only maximal strength is objective enough to measure.", "A harder workout necessarily creates a better adaptation."],
        correct: 1,
        explanation: "Related outcomes can influence one another, but they are not the same construct. Good decisions begin by defining the outcome and choosing a measurement that actually represents it."
      },
      labs: [
        { id: "lab-1", title: "Define the Task", summary: "Analyze three ordinary gym exercises using load, reps, range of motion, tempo, stability/support, and RPE/RIR. Identify what was measured, what can be inferred, and what cannot." }
      ],
      assignment: { id: "assignment-1", title: "Causal Map", summary: "Build a chain from training task → mechanics → acute demand → repeated exposure → adaptation → changed performance. Include competing explanations and uncertainty." }
    },
    {
      week: 2,
      title: "Biomechanics",
      essentialQuestion: "How do forces acting on the body become demands on joints and muscles?",
      hours: "~12 hours",
      topics: ["Force", "Torque", "Moment arms", "Center of mass", "Stability", "Range of motion", "Work and power", "Force–velocity", "Anthropometry"],
      quiz: {
        id: "quiz-2",
        title: "Biomechanics",
        question: "External joint torque depends most directly on which two quantities?",
        options: ["Force and the perpendicular moment arm", "Heart rate and repetition speed", "Muscle soreness and range of motion", "Body mass and RPE only"],
        correct: 0,
        explanation: "Torque is the rotational effect of force and depends on the applied force and its perpendicular distance from the joint axis."
      },
      labs: [
        { id: "lab-2", title: "Moment Arms in the Real Gym", summary: "Use a curl, lateral raise, squat, cable movement, or machine movement to identify force direction, joint axis, approximate external moment arm, and how external torque changes through range of motion." }
      ],
      assignment: { id: "assignment-2", title: "Biomechanics Exercise Analysis", summary: "Compare two exercises with a similar target and explain mechanically relevant similarities, differences, assumptions, and limitations." }
    },
    {
      week: 3,
      title: "How Humans Produce Force",
      essentialQuestion: "Why can a person produce—or fail to produce—force?",
      hours: "~12 hours",
      topics: ["Skeletal muscle", "Sarcomeres", "Excitation–contraction", "Motor units", "Recruitment", "Rate coding", "Coordination", "Skill", "Neural adaptation", "Fatigue"],
      quiz: {
        id: "quiz-3",
        title: "Neuromuscular Force Production",
        question: "A lifter becomes stronger without a large detectable increase in muscle size. Which explanation is most defensible?",
        options: ["The measurement must be wrong.", "Neural, technical, and coordination adaptations can improve force expression without large hypertrophy.", "Only tendon stiffness can explain the change.", "Strength cannot improve without visible hypertrophy."],
        correct: 1,
        explanation: "Strength is a task-specific performance outcome. Skill, coordination, motor-unit behavior, confidence, and other neural/technical factors can improve performance even when hypertrophy is modest."
      },
      labs: [
        { id: "lab-3", title: "Stability and Performance", summary: "Compare closely related supported and less-supported exercise variants with conservative loads. Record performance, RPE/RIR, technique, and limiting factors." }
      ],
      assignment: { id: "assignment-3", title: "Explain a Strength Gain", summary: "Construct multiple plausible explanations for improved strength with little detectable hypertrophy and specify what data could distinguish them." }
    },
    {
      week: 4,
      title: "From a Repetition to an Adaptation",
      essentialQuestion: "How does mechanical loading become biological change?",
      hours: "~12.5 hours",
      topics: ["Muscle architecture", "Mechanosensation", "Mechanotransduction", "Cell signaling", "Protein turnover", "Ribosomal capacity", "Satellite cells", "Remodeling", "Limits of acute biomarkers"],
      quiz: {
        id: "quiz-4",
        title: "Adaptation Biology",
        question: "A training method produces a larger acute signaling response after one workout. What can you conclude?",
        options: ["It will definitely produce more long-term hypertrophy.", "It is mechanistically interesting, but acute signaling alone does not prove a superior long-term outcome.", "The method is unsafe.", "The method should replace all alternatives."],
        correct: 1,
        explanation: "Acute mechanistic signals can help explain biology and generate hypotheses, but long-term programming claims should be supported by longitudinal outcome evidence."
      },
      labs: [
        { id: "lab-4", title: "Muscle Length and Exercise Position", summary: "Compare safe exercise positions that alter muscle length. Predict anatomical consequences and distinguish acute sensation/performance from chronic adaptation." }
      ],
      assignment: { id: "assignment-4", title: "Force-to-Adaptation Mechanism Map", summary: "Trace external loading to tissue adaptation while labeling direct evidence, inference, uncertainty, and mechanisms that may not be rate limiting." }
    },
    {
      week: 5,
      title: "Hypertrophy",
      essentialQuestion: "How do we build muscle effectively without pretending there is one magical program?",
      hours: "~12.5 hours",
      topics: ["Load and repetition range", "RIR", "Failure", "Volume", "Frequency", "Rest intervals", "Exercise selection", "Range of motion", "Muscle length", "Progression", "Individual variation"],
      quiz: {
        id: "quiz-5",
        title: "Hypertrophy Programming",
        question: "Which statement is the best evidence-informed summary of repetition ranges for hypertrophy?",
        options: ["Only 8–12 repetitions can build muscle.", "A broad range of loads can support hypertrophy when sets are sufficiently challenging and the program provides enough useful work.", "Only very heavy loads can stimulate growth.", "Repetition range never affects fatigue or practicality."],
        correct: 1,
        explanation: "Hypertrophy is possible across a broad loading range. Load still changes fatigue, repetition count, skill demands, and how practical a prescription is."
      },
      labs: [
        { id: "lab-5a", title: "Load–Repetition Relationship", summary: "Use a stable, safe exercise at multiple submaximal loads. Record load, reps, RPE, and RIR; graph and interpret your own load–rep behavior." },
        { id: "lab-5b", title: "RIR Calibration", summary: "On a safe low-consequence exercise, make an RIR prediction and—only when appropriate—estimate your prediction error. No forced repetitions or unsafe failure testing." }
      ],
      assignment: { id: "assignment-5", title: "Four-Week Hypertrophy Block", summary: "Design a bounded hypertrophy block with evidence-based rationale, progression rules, and explicit uncertainty." }
    },
    {
      week: 6,
      title: "Maximum Strength",
      essentialQuestion: "What changes when the outcome is maximal force expression rather than muscle size?",
      hours: "~12 hours",
      topics: ["High-load specificity", "Strength as skill", "Volume", "Frequency", "Rest", "RPE/RIR", "Autoregulation", "Peaking", "Strength testing", "1RM estimation"],
      quiz: {
        id: "quiz-6",
        title: "Maximum Strength",
        question: "If the primary outcome is a one-repetition maximum in a specific lift, which training feature is especially important?",
        options: ["Avoiding the lift until test day", "Regular technically sound practice with relatively high loads while managing fatigue", "Using only isolation exercises", "Changing the main movement every session"],
        correct: 1,
        explanation: "Maximal strength is highly specific to the task. Heavy, technically relevant practice is useful when the goal is improving 1RM performance."
      },
      labs: [
        { id: "lab-6", title: "Submaximal 1RM Estimation", summary: "Perform familiar submaximal sets, compare multiple prediction approaches, and analyze uncertainty as repetitions and RIR increase. True maximal testing is not required." }
      ],
      assignment: { id: "assignment-6", title: "Strength Microcycle", summary: "Design one week for a defined strength outcome and justify exercise selection, intensity, volume, frequency, recovery, and monitoring." }
    },
    {
      week: 7,
      title: "Power and Athletic Performance",
      essentialQuestion: "How does training change when producing force quickly matters?",
      hours: "~12 hours",
      topics: ["Power", "Rate of force development", "Impulse", "Velocity intent", "Stretch–shortening cycle", "Jumps", "Plyometrics", "Olympic-lift derivatives", "Sprint concepts", "Transfer", "Fatigue"],
      quiz: {
        id: "quiz-7",
        title: "Power and Explosive Performance",
        question: "Mechanical power is most simply described as:",
        options: ["Force multiplied by velocity", "Force divided by body mass only", "Work multiplied by time", "Heart rate multiplied by RPE"],
        correct: 0,
        explanation: "Mechanical power reflects how quickly work is done and can be expressed as force × velocity. Training for power therefore involves both force production and movement velocity."
      },
      labs: [
        { id: "lab-7", title: "Movement Intent and Performance", summary: "Compare controlled versus intentionally fast concentric performance using a low-risk exercise or machine. Use repetition duration, video timing, machine output if available, and RPE while discussing measurement limits." }
      ],
      assignment: { id: "assignment-7", title: "Build Three Sessions", summary: "Design strength-focused, power-focused, and mixed sessions for the same athlete, with explicit rationale for why they differ." }
    },
    {
      week: 8,
      title: "Conditioning and Concurrent Training",
      essentialQuestion: "How do we develop an engine without unnecessarily compromising other adaptations?",
      hours: "~12 hours",
      topics: ["Aerobic metabolism", "VO₂ concepts", "Thresholds", "Anaerobic contribution", "Repeated effort", "RPE", "Talk test", "Intervals", "Intensity zones", "Concurrent training", "Modality", "Sequencing"],
      quiz: {
        id: "quiz-8",
        title: "Conditioning",
        question: "Which statement about concurrent strength and endurance training is most defensible?",
        options: ["They can never be trained in the same program.", "They can be combined, but total stress, modality, sequencing, volume, and the athlete’s priorities affect the tradeoffs.", "Cardio always eliminates strength gains.", "Only heart-rate zones determine compatibility."],
        correct: 1,
        explanation: "Concurrent training is not inherently incompatible. Interference risk depends on the actual program, including volume, modality, sequencing, recovery, and the adaptations being prioritized."
      },
      labs: [
        { id: "lab-8a", title: "RPE, Talk Test, and Heart Rate", summary: "Use staged bike, treadmill, rower, elliptical, or stair work. Record workload, heart rate if available, RPE, and talk-test response." },
        { id: "lab-8b", title: "Heart-Rate Recovery", summary: "Observe end-exercise, 1-minute, and 2-minute heart-rate recovery and interpret it as an exercise-physiology observation—not a medical diagnostic." }
      ],
      assignment: { id: "assignment-8", title: "Concurrent Training Plan", summary: "Integrate resistance and conditioning training for a defined athlete with realistic schedule constraints." }
    },
    {
      week: 9,
      title: "Tissue Adaptation, Recovery, and Monitoring",
      essentialQuestion: "How do we make performance sustainable and know whether adaptation is occurring?",
      hours: "~12.5 hours",
      topics: ["Tendon", "Bone", "Cartilage", "Adaptation timescales", "Load tolerance", "Pain vs damage", "Referral", "Fatigue", "Sleep", "Stress", "Monitoring", "Signal vs noise", "Deloads"],
      quiz: {
        id: "quiz-9",
        title: "Tissue Adaptation, Recovery, and Monitoring",
        question: "Which statement best fits NAV’s scope and evidence standard?",
        options: ["Pain intensity directly tells you the amount of tissue damage.", "A coach can diagnose the injured structure if training data are detailed enough.", "Pain, performance, recovery, and training data can inform coaching decisions, but concerning symptoms or diagnostic questions require appropriate referral.", "Soreness is the best single readiness metric."],
        correct: 2,
        explanation: "Monitoring can guide training, but pain is not a direct damage meter and coaching data do not replace diagnosis. Referral boundaries remain important."
      },
      labs: [
        { id: "lab-9", title: "Repeat Performance and Recovery", summary: "Standardize a safe resistance exercise and compare performance after different rest intervals. Record load, reps, RPE/RIR, and rest; interpret fatigue and programming consequences." }
      ],
      assignment: { id: "assignment-9", title: "Monitoring and Adjustment Case", summary: "Use several weeks of messy training/recovery data to choose progress, maintain, reduce, modify, investigate, or refer—and defend the decision." }
    },
    {
      week: 10,
      title: "Nutrition, Integration, and Coaching Decisions",
      essentialQuestion: "How do we combine the pieces into good decisions for actual humans?",
      hours: "~12.5 hours",
      topics: ["Energy balance", "Energy availability", "Protein", "Carbohydrate", "Dietary fat", "Hydration", "Creatine", "Supplements", "Body composition", "Communication", "Individualization", "Scope", "Referral", "Sport applications"],
      quiz: {
        id: "quiz-10",
        title: "Cumulative Integration Quiz",
        question: "What is the strongest reason to collect training and recovery data?",
        options: ["To maximize the number of metrics in the dashboard", "To replace coach and athlete judgment", "To answer specific questions about whether the plan is producing the intended result and guide defensible adjustments", "To change the program whenever one daily value worsens"],
        correct: 2,
        explanation: "Data are useful when they reduce uncertainty around a real decision. More data are not automatically better, and day-to-day noise should not force constant program changes."
      },
      labs: [
        { id: "lab-10", title: "Personal Training Audit", summary: "Analyze one ordinary training session for exercise sequence, load, reps, sets, rest, RPE/RIR, duration, and stated goal. Identify mismatches and make one justified modification." }
      ],
      assignment: { id: "assignment-10", title: "Integrated Program Critique", summary: "Critique a realistic existing program across exercise selection, loading, volume, effort, conditioning, recovery, evidence quality, and safety/referral; recommend justified changes." }
    }
  ],
  starterModules: [
    { id: "how-training-works", title: "How Training Actually Works", href: "how-training-works/index.html" },
    { id: "building-muscle", title: "Building Muscle", href: "building-muscle/index.html" },
    { id: "getting-strong", title: "Getting Strong", href: "getting-strong/index.html" },
    { id: "rir-rpe", title: "Sets, Reps, RIR & RPE", href: "rir-rpe/index.html" },
    { id: "choosing-exercises", title: "Choosing Good Exercises", href: "choosing-exercises/index.html" },
    { id: "programming-a-workout", title: "Programming a Workout", href: "programming-a-workout/index.html" },
    { id: "recovery", title: "Recovery Is Training Too", href: "recovery/index.html" },
    { id: "build-your-system", title: "Build Your Training System", href: "build-your-system/index.html" }
  ]
};
