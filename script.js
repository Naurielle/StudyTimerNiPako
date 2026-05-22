(() => {
  const STORAGE_KEY = "studyTimerNiPako.state.v1";
  const BANK_CAP_SECONDS = 2 * 60 * 60;
  const STREAK_STUDY_SECONDS = 30 * 60;
  const UNLOCK_STUDY_SECONDS = 60 * 60;
  const WELLNESS_START_SECONDS = 2 * 60 * 60;
  const WELLNESS_INTERVAL_SECONDS = 30 * 60;
  const WARNING_MARKS = [60 * 60, 5 * 60, 60];
  const BREAK_DONE_MESSAGE = "tama na yan boss, aral na ulit.";
  const MIN_STUDY_MESSAGE = "Tamad! Mag-aral ka muna!";

  const PAKO_PRESET = {
    id: "pako",
    name: "Pako Mode",
    minStudySec: 10 * 60,
    firstBreakSec: 5 * 60,
    secondThresholdSec: 30 * 60,
    secondBreakSec: 10 * 60,
    bonusStartSec: 60 * 60,
    bonusBlockSec: 4 * 60,
    bonusBreakSec: 2 * 60
  };

  const els = {
    alarmDialog: byId("alarmDialog"),
    bankSpendHelp: byId("bankSpendHelp"),
    bankSpendInput: byId("bankSpendInput"),
    bankSpendRow: byId("bankSpendRow"),
    breakBankStat: byId("breakBankStat"),
    breakMeterBar: byId("breakMeterBar"),
    clearDataButton: byId("clearDataButton"),
    closeSettingsButton: byId("closeSettingsButton"),
    confirmBreakButton: byId("confirmBreakButton"),
    confirmBreakDialog: byId("confirmBreakDialog"),
    confirmBreakText: byId("confirmBreakText"),
    customBonusBlock: byId("customBonusBlock"),
    customBonusBreak: byId("customBonusBreak"),
    customBonusStart: byId("customBonusStart"),
    customFirstBreak: byId("customFirstBreak"),
    customMinStudy: byId("customMinStudy"),
    customSecondBreak: byId("customSecondBreak"),
    customSecondThreshold: byId("customSecondThreshold"),
    dismissAlarmButton: byId("dismissAlarmButton"),
    enableNotificationsButton: byId("enableNotificationsButton"),
    endBreakButton: byId("endBreakButton"),
    earnedBreakText: byId("earnedBreakText"),
    exportButton: byId("exportButton"),
    goalStat: byId("goalStat"),
    graceDateInput: byId("graceDateInput"),
    historyList: byId("historyList"),
    importInput: byId("importInput"),
    manualAdjustInput: byId("manualAdjustInput"),
    manualAdjustRow: byId("manualAdjustRow"),
    modePill: byId("modePill"),
    nextRewardText: byId("nextRewardText"),
    notificationStatus: byId("notificationStatus"),
    pauseStudyButton: byId("pauseStudyButton"),
    presetLabel: byId("presetLabel"),
    presetSelect: byId("presetSelect"),
    resetButton: byId("resetButton"),
    restoreYesterdayButton: byId("restoreYesterdayButton"),
    resumeStudyButton: byId("resumeStudyButton"),
    saveCustomPresetButton: byId("saveCustomPresetButton"),
    saveGoalsButton: byId("saveGoalsButton"),
    scheduleGraceButton: byId("scheduleGraceButton"),
    sessionGoalFill: byId("sessionGoalFill"),
    sessionGoalInput: byId("sessionGoalInput"),
    sessionGoalText: byId("sessionGoalText"),
    settingsBackdrop: byId("settingsBackdrop"),
    settingsPanel: byId("settingsPanel"),
    settingsToggle: byId("settingsToggle"),
    skipBreakButton: byId("skipBreakButton"),
    soundSelect: byId("soundSelect"),
    soundUpload: byId("soundUpload"),
    startStudyButton: byId("startStudyButton"),
    statusMessage: byId("statusMessage"),
    streakStat: byId("streakStat"),
    streakToolsText: byId("streakToolsText"),
    studyGoalFill: byId("studyGoalFill"),
    studyGoalInput: byId("studyGoalInput"),
    studyGoalText: byId("studyGoalText"),
    takeBreakButton: byId("takeBreakButton"),
    testSoundButton: byId("testSoundButton"),
    themeToggle: byId("themeToggle"),
    timerTitle: byId("timerTitle"),
    timerDisplay: byId("timerDisplay"),
    toastStack: byId("toastStack"),
    todaySessionsStat: byId("todaySessionsStat"),
    todayStudyStat: byId("todayStudyStat"),
    unlockStat: byId("unlockStat"),
    useBankButton: byId("useBankButton"),
    volumeSlider: byId("volumeSlider")
  };

  let state = normalizeState(readState());
  let tickHandle = null;
  let audioContext = null;
  let alarmInterval = null;
  let alarmAudio = null;
  let alarmClickArmed = false;

  init();

  function byId(id) {
    return document.getElementById(id);
  }

  function defaultState() {
    return {
      mode: "idle",
      studySeconds: 0,
      studyStartedAt: null,
      studySessionStartedAt: null,
      breakDurationSec: 0,
      breakStartedAt: null,
      breakEndAt: null,
      activeSessionId: null,
      breakBankSpentSec: 0,
      manualAdjustSec: 0,
      warningMarks: [],
      wellnessMarks: [],
      alarmActive: false,
      bankSec: 0,
      sessions: [],
      goals: {
        studyMinutes: null,
        sessions: null
      },
      streak: {
        current: 0,
        best: 0,
        oneHourCurrent: 0,
        oneHourBest: 0,
        unlockAchieved: false,
        restoreTokens: 3,
        graceTokens: 0,
        graceAwardedDates: [],
        scheduledGraceDays: [],
        restoredDays: []
      },
      settings: {
        theme: "light",
        activePresetId: "pako",
        sound: "warmBell",
        customSoundDataUrl: null,
        volume: 0.7,
        notificationsEnabled: false
      },
      customPreset: null
    };
  }

  function normalizeState(saved) {
    const base = defaultState();
    const next = saved && typeof saved === "object" ? saved : {};
    const normalized = {
      ...base,
      ...next,
      goals: { ...base.goals, ...(next.goals || {}) },
      streak: { ...base.streak, ...(next.streak || {}) },
      settings: { ...base.settings, ...(next.settings || {}) }
    };

    normalized.sessions = Array.isArray(normalized.sessions) ? normalized.sessions : [];
    normalized.streak.graceAwardedDates = uniqueStrings(normalized.streak.graceAwardedDates);
    normalized.streak.scheduledGraceDays = uniqueStrings(normalized.streak.scheduledGraceDays);
    normalized.streak.restoredDays = uniqueStrings(normalized.streak.restoredDays);
    normalized.warningMarks = Array.isArray(normalized.warningMarks) ? normalized.warningMarks : [];
    normalized.wellnessMarks = Array.isArray(normalized.wellnessMarks) ? normalized.wellnessMarks : [];
    normalized.bankSec = clamp(Number(normalized.bankSec) || 0, 0, BANK_CAP_SECONDS);

    if (normalized.mode === "study") {
      normalized.mode = "paused";
      normalized.studyStartedAt = null;
    }

    return normalized;
  }

  function uniqueStrings(items) {
    if (!Array.isArray(items)) {
      return [];
    }
    return [...new Set(items.filter((item) => typeof item === "string"))];
  }

  function readState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function persist() {
    const snapshot = { ...state };

    if (state.mode === "study") {
      snapshot.mode = "paused";
      snapshot.studySeconds = currentStudySeconds();
      snapshot.studyStartedAt = null;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      toast("Storage full", "Try a shorter custom sound or export your data before clearing space.");
    }
  }

  function init() {
    applyTheme();
    bindEvents();
    populateSettingsFields();
    recoverBreakIfNeeded();
    recalculateAndStoreStreaks(false);
    render();
    tickHandle = window.setInterval(tick, 1000);
  }

  function bindEvents() {
    els.startStudyButton.addEventListener("click", startStudy);
    els.pauseStudyButton.addEventListener("click", pauseStudy);
    els.resumeStudyButton.addEventListener("click", resumeStudy);
    els.takeBreakButton.addEventListener("click", openBreakConfirmation);
    els.endBreakButton.addEventListener("click", () => completeBreak("early"));
    els.skipBreakButton.addEventListener("click", () => completeBreak("skip"));
    els.resetButton.addEventListener("click", resetCurrentTimer);
    els.themeToggle.addEventListener("click", toggleTheme);
    els.settingsToggle.addEventListener("click", openSettings);
    els.closeSettingsButton.addEventListener("click", closeSettings);
    els.settingsBackdrop.addEventListener("click", closeSettings);
    els.saveGoalsButton.addEventListener("click", saveGoals);
    els.saveCustomPresetButton.addEventListener("click", saveCustomPreset);
    els.presetSelect.addEventListener("change", changePreset);
    els.soundSelect.addEventListener("change", changeSound);
    els.soundUpload.addEventListener("change", uploadSound);
    els.volumeSlider.addEventListener("input", changeVolume);
    els.testSoundButton.addEventListener("click", () => playSelectedSound(false));
    els.enableNotificationsButton.addEventListener("click", enableNotifications);
    els.scheduleGraceButton.addEventListener("click", scheduleGraceDay);
    els.restoreYesterdayButton.addEventListener("click", restoreYesterday);
    els.exportButton.addEventListener("click", exportData);
    els.importInput.addEventListener("change", importData);
    els.clearDataButton.addEventListener("click", clearData);
    els.useBankButton.addEventListener("click", explainBankUse);
    els.confirmBreakDialog.addEventListener("close", handleBreakDialogClose);
    els.dismissAlarmButton.addEventListener("click", startStudy);
    els.alarmDialog.addEventListener("close", dismissAlarm);
    window.addEventListener("beforeunload", persist);
    document.addEventListener("click", handleAlarmClick, true);
  }

  function tick() {
    if (state.mode === "study") {
      checkWellnessReminder();
    }

    if (state.mode === "break") {
      const remaining = currentBreakRemainingSeconds();
      checkBreakWarnings(remaining);
      if (remaining <= 0) {
        completeBreak("finished");
      }
    }

    render();
    persist();
  }

  function startStudy() {
    stopAlarm();
    state.mode = "study";
    state.studySeconds = 0;
    state.studyStartedAt = Date.now();
    state.studySessionStartedAt = new Date().toISOString();
    state.breakDurationSec = 0;
    state.breakStartedAt = null;
    state.breakEndAt = null;
    state.activeSessionId = null;
    state.breakBankSpentSec = 0;
    state.manualAdjustSec = 0;
    state.warningMarks = [];
    state.wellnessMarks = [];
    state.alarmActive = false;
    setStatus("Study timer started. Keep going until you are ready to earn the break.");
    render();
    persist();
  }

  function pauseStudy() {
    if (state.mode !== "study") {
      return;
    }
    state.studySeconds = currentStudySeconds();
    state.studyStartedAt = null;
    state.mode = "paused";
    setStatus("Paused. Your saved study time is still here.");
    render();
    persist();
  }

  function resumeStudy() {
    if (state.mode !== "paused") {
      return;
    }
    state.mode = "study";
    state.studyStartedAt = Date.now();
    if (!state.studySessionStartedAt) {
      state.studySessionStartedAt = new Date().toISOString();
    }
    setStatus("Resumed. The clock is moving again.");
    render();
    persist();
  }

  function resetCurrentTimer() {
    const hasActiveTimer = state.mode === "study" || state.mode === "paused" || state.mode === "break";
    if (hasActiveTimer && !window.confirm("Reset the current timer? Saved stats will stay.")) {
      return;
    }

    stopAlarm();
    state.mode = "idle";
    state.studySeconds = 0;
    state.studyStartedAt = null;
    state.studySessionStartedAt = null;
    state.breakDurationSec = 0;
    state.breakStartedAt = null;
    state.breakEndAt = null;
    state.activeSessionId = null;
    state.warningMarks = [];
    state.wellnessMarks = [];
    state.alarmActive = false;
    setStatus("Reset. Ready for a fresh study session.");
    render();
    persist();
  }

  function openBreakConfirmation() {
    if (state.mode !== "study" && state.mode !== "paused") {
      return;
    }

    const studySec = currentStudySeconds();
    const preset = getActivePreset();
    const earnedSec = calculateBreakSeconds(studySec, preset);

    if (studySec < preset.minStudySec || earnedSec <= 0) {
      setStatus(MIN_STUDY_MESSAGE);
      toast("Minimum study time", MIN_STUDY_MESSAGE);
      return;
    }

    const unlocked = state.streak.unlockAchieved;
    els.confirmBreakText.textContent = `You studied ${formatDuration(studySec)} and earned ${formatDuration(earnedSec)} of break.`;
    els.bankSpendInput.value = 0;
    els.bankSpendInput.max = Math.floor(state.bankSec / 60);
    els.bankSpendInput.disabled = !unlocked || state.bankSec <= 0;
    els.bankSpendHelp.textContent = unlocked
      ? `Available bank: ${formatDuration(state.bankSec)}. You choose how much to spend.`
      : "Bank spending unlocks after a 7-day 1-hour streak.";
    els.manualAdjustInput.value = 0;
    els.manualAdjustInput.disabled = !unlocked;
    els.manualAdjustRow.hidden = false;
    els.bankSpendRow.hidden = false;

    if (typeof els.confirmBreakDialog.showModal === "function") {
      els.confirmBreakDialog.showModal();
    } else if (window.confirm(`${els.confirmBreakText.textContent} Start break?`)) {
      startBreakFromConfirmation();
    }
  }

  function handleBreakDialogClose() {
    if (els.confirmBreakDialog.returnValue === "confirm") {
      startBreakFromConfirmation();
    }
    els.confirmBreakDialog.returnValue = "";
  }

  function startBreakFromConfirmation() {
    const studySec = currentStudySeconds();
    const preset = getActivePreset();
    const earnedSec = calculateBreakSeconds(studySec, preset);

    if (studySec < preset.minStudySec || earnedSec <= 0) {
      setStatus(MIN_STUDY_MESSAGE);
      toast("Minimum study time", MIN_STUDY_MESSAGE);
      return;
    }

    const unlocked = state.streak.unlockAchieved;
    const requestedBankMinutes = unlocked ? Number.parseInt(els.bankSpendInput.value, 10) || 0 : 0;
    const spendSec = clamp(requestedBankMinutes * 60, 0, state.bankSec);
    const manualMinutes = unlocked ? Number.parseInt(els.manualAdjustInput.value, 10) || 0 : 0;
    const manualSec = manualMinutes * 60;
    const totalBreakSec = Math.max(60, earnedSec + spendSec + manualSec);
    const now = Date.now();
    const session = {
      id: String(now),
      date: dateKey(new Date(now)),
      startedAt: state.studySessionStartedAt || new Date(now - studySec * 1000).toISOString(),
      studySec,
      earnedBreakSec: earnedSec,
      plannedBreakSec: totalBreakSec,
      bankSpentSec: spendSec,
      manualAdjustSec: manualSec,
      actualBreakSec: 0,
      breakResult: "active",
      presetName: preset.name,
      createdAt: new Date(now).toISOString(),
      breakCompletedAt: null
    };

    state.sessions.push(session);
    state.sessions = state.sessions.slice(-500);
    state.bankSec = clamp(state.bankSec - spendSec, 0, BANK_CAP_SECONDS);
    state.mode = "break";
    state.studySeconds = 0;
    state.studyStartedAt = null;
    state.studySessionStartedAt = null;
    state.breakDurationSec = totalBreakSec;
    state.breakStartedAt = now;
    state.breakEndAt = now + totalBreakSec * 1000;
    state.activeSessionId = session.id;
    state.breakBankSpentSec = spendSec;
    state.manualAdjustSec = manualSec;
    state.warningMarks = [];
    state.wellnessMarks = [];
    recalculateAndStoreStreaks(true);
    notifyUser("Break started", `You earned ${formatDuration(earnedSec)}. Enjoy your break.`);
    render();
    persist();
  }

  function completeBreak(reason) {
    if (state.mode !== "break" && reason !== "finished") {
      return;
    }

    const now = Date.now();
    const elapsedSec = state.breakStartedAt
      ? clamp(Math.floor((now - state.breakStartedAt) / 1000), 0, state.breakDurationSec)
      : state.breakDurationSec;
    const remainingSec = clamp(state.breakDurationSec - elapsedSec, 0, state.breakDurationSec);

    if (reason === "early") {
      const before = state.bankSec;
      state.bankSec = clamp(state.bankSec + remainingSec, 0, BANK_CAP_SECONDS);
      const added = state.bankSec - before;
      toast("Break bank updated", `${formatDuration(added)} saved for later.`);
    }

    updateActiveSession(elapsedSec, reason);
    state.mode = "breakComplete";
    state.breakDurationSec = 0;
    state.breakStartedAt = null;
    state.breakEndAt = null;
    state.activeSessionId = null;
    state.warningMarks = [];
    state.breakBankSpentSec = 0;
    state.manualAdjustSec = 0;

    if (reason === "finished") {
      state.alarmActive = true;
      activateBreakFinishedAlarm();
    } else if (reason === "skip") {
      state.alarmActive = false;
      setStatus("Break skipped. Start studying again when you are ready.");
    } else {
      state.alarmActive = false;
      setStatus("Break ended early. Unused time was sent to your break bank.");
    }

    render();
    persist();
  }

  function updateActiveSession(actualBreakSec, result) {
    const session = state.sessions.find((item) => item.id === state.activeSessionId);
    if (!session) {
      return;
    }
    session.actualBreakSec = actualBreakSec;
    session.breakResult = result;
    session.breakCompletedAt = new Date().toISOString();
  }

  function recoverBreakIfNeeded() {
    if (state.mode === "break" && state.breakEndAt && Date.now() >= state.breakEndAt) {
      completeBreak("finished");
      return;
    }

    if (state.mode === "breakComplete" && state.alarmActive) {
      activateBreakFinishedAlarm();
    }

    if (state.mode === "paused" && state.studySeconds > 0) {
      setStatus("Your last saved study time was restored and paused.");
    }
  }

  function currentStudySeconds() {
    if (state.mode === "study" && state.studyStartedAt) {
      return state.studySeconds + Math.max(0, Math.floor((Date.now() - state.studyStartedAt) / 1000));
    }
    return state.studySeconds;
  }

  function currentBreakRemainingSeconds() {
    if (state.mode !== "break" || !state.breakEndAt) {
      return 0;
    }
    return Math.max(0, Math.ceil((state.breakEndAt - Date.now()) / 1000));
  }

  function calculateBreakSeconds(studySec, preset) {
    if (studySec < preset.minStudySec) {
      return 0;
    }

    if (studySec < preset.secondThresholdSec) {
      return preset.firstBreakSec;
    }

    if (studySec < preset.bonusStartSec) {
      return preset.secondBreakSec;
    }

    const completedBlocks = Math.floor((studySec - preset.bonusStartSec) / preset.bonusBlockSec);
    return preset.secondBreakSec + completedBlocks * preset.bonusBreakSec;
  }

  function getActivePreset() {
    if (state.settings.activePresetId === "custom" && state.customPreset) {
      return state.customPreset;
    }
    return PAKO_PRESET;
  }

  function render() {
    applyTheme();
    const preset = getActivePreset();
    const studySec = currentStudySeconds();
    const earnedSec = calculateBreakSeconds(studySec, preset);
    const totals = getDailyTotals(true);
    const today = dateKey();
    const todayTotals = totals[today] || emptyTotals();
    const streakInfo = calculateStreaks(totals);
    const timerValue = state.mode === "break" ? currentBreakRemainingSeconds() : studySec;

    els.timerDisplay.textContent = formatClock(timerValue);
    els.timerTitle.textContent = timerTitleText();
    els.modePill.textContent = modeLabel();
    els.presetLabel.textContent = preset.name;
    els.earnedBreakText.textContent = `Earned break: ${formatDuration(earnedSec)}`;
    els.nextRewardText.textContent = nextRewardText(studySec, preset);
    els.breakMeterBar.style.width = `${rewardProgress(studySec, preset)}%`;

    els.todayStudyStat.textContent = formatDuration(todayTotals.studySec);
    els.todaySessionsStat.textContent = String(todayTotals.sessions);
    els.breakBankStat.textContent = formatDuration(state.bankSec);
    els.streakStat.textContent = `${streakInfo.current} ${streakInfo.current === 1 ? "day" : "days"}`;
    els.goalStat.textContent = goalSummary(todayTotals);
    els.unlockStat.textContent = state.streak.unlockAchieved ? "Unlocked" : `${Math.max(0, 7 - streakInfo.oneHourCurrent)} days left`;
    els.studyGoalFill.style.width = `${goalPercent(todayTotals.studySec, (state.goals.studyMinutes || 0) * 60)}%`;
    els.sessionGoalFill.style.width = `${goalPercent(todayTotals.sessions, state.goals.sessions || 0)}%`;
    els.studyGoalText.textContent = state.goals.studyMinutes
      ? `${formatDuration(todayTotals.studySec)} of ${state.goals.studyMinutes}m`
      : "No study goal set.";
    els.sessionGoalText.textContent = state.goals.sessions
      ? `${todayTotals.sessions} of ${state.goals.sessions} sessions`
      : "No session goal set.";
    els.streakToolsText.textContent = `Grace days: ${state.streak.graceTokens}. Restores left: ${state.streak.restoreTokens}. Best streak: ${state.streak.best} days.`;
    els.notificationStatus.textContent = notificationStatusText();

    renderHistory();
    renderButtons();
  }

  function renderButtons() {
    const isStudying = state.mode === "study";
    const isPaused = state.mode === "paused";
    const isBreak = state.mode === "break";
    const canStart = state.mode === "idle" || state.mode === "breakComplete";

    els.startStudyButton.disabled = !canStart;
    els.pauseStudyButton.disabled = !isStudying;
    els.resumeStudyButton.disabled = !isPaused;
    els.takeBreakButton.disabled = !(isStudying || isPaused);
    els.endBreakButton.disabled = !isBreak;
    els.skipBreakButton.disabled = !isBreak;
    els.useBankButton.disabled = state.bankSec <= 0;
  }

  function renderHistory() {
    const latest = [...state.sessions].reverse().slice(0, 6);

    if (latest.length === 0) {
      els.historyList.innerHTML = `<div class="history-item"><div><strong>No sessions yet</strong><span>Your finished study sessions will appear here.</span></div></div>`;
      return;
    }

    els.historyList.innerHTML = latest.map((session) => {
      const started = new Date(session.startedAt);
      const title = `${formatDuration(session.studySec)} study`;
      const details = `${formatDuration(session.earnedBreakSec)} earned · ${formatDuration(session.actualBreakSec || 0)} break used · ${session.presetName}`;
      return `
        <div class="history-item">
          <div>
            <strong>${escapeHtml(title)}</strong>
            <span>${escapeHtml(details)}</span>
          </div>
          <span>${escapeHtml(started.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))}</span>
        </div>
      `;
    }).join("");
  }

  function modeLabel() {
    if (state.mode === "study") return "Studying";
    if (state.mode === "paused") return "Paused";
    if (state.mode === "break") return "Break";
    if (state.mode === "breakComplete") return "Break done";
    return "Ready";
  }

  function timerTitleText() {
    if (state.mode === "study") return "Study time";
    if (state.mode === "paused") return "Paused study time";
    if (state.mode === "break") return "Break time remaining";
    if (state.mode === "breakComplete") return "Break finished";
    return "Ready when you are";
  }

  function nextRewardText(studySec, preset) {
    if (state.mode === "break") {
      return "Break time is counted in real time.";
    }

    if (studySec < preset.minStudySec) {
      return `Study ${formatClock(preset.minStudySec - studySec)} more to unlock a break`;
    }

    if (studySec < preset.secondThresholdSec) {
      return `${formatDuration(preset.secondBreakSec)} break at ${formatClock(preset.secondThresholdSec)}`;
    }

    if (studySec < preset.bonusStartSec) {
      return `Bonus break starts at ${formatClock(preset.bonusStartSec)}`;
    }

    const blocks = Math.floor((studySec - preset.bonusStartSec) / preset.bonusBlockSec);
    const nextAt = preset.bonusStartSec + (blocks + 1) * preset.bonusBlockSec;
    return `Next +${formatDuration(preset.bonusBreakSec)} at ${formatClock(nextAt)}`;
  }

  function rewardProgress(studySec, preset) {
    if (state.mode === "break") {
      const remaining = currentBreakRemainingSeconds();
      return state.breakDurationSec ? clamp(((state.breakDurationSec - remaining) / state.breakDurationSec) * 100, 0, 100) : 0;
    }

    if (studySec < preset.minStudySec) {
      return clamp((studySec / preset.minStudySec) * 100, 0, 100);
    }

    if (studySec < preset.secondThresholdSec) {
      return clamp(((studySec - preset.minStudySec) / (preset.secondThresholdSec - preset.minStudySec)) * 100, 0, 100);
    }

    if (studySec < preset.bonusStartSec) {
      return clamp(((studySec - preset.secondThresholdSec) / (preset.bonusStartSec - preset.secondThresholdSec)) * 100, 0, 100);
    }

    const blockProgress = (studySec - preset.bonusStartSec) % preset.bonusBlockSec;
    return clamp((blockProgress / preset.bonusBlockSec) * 100, 0, 100);
  }

  function getDailyTotals(includeActiveStudy) {
    const totals = {};

    for (const session of state.sessions) {
      if (!totals[session.date]) {
        totals[session.date] = emptyTotals();
      }
      totals[session.date].studySec += Number(session.studySec) || 0;
      totals[session.date].earnedBreakSec += Number(session.earnedBreakSec) || 0;
      totals[session.date].actualBreakSec += Number(session.actualBreakSec) || 0;
      totals[session.date].sessions += 1;
    }

    if (includeActiveStudy && (state.mode === "study" || state.mode === "paused")) {
      const today = dateKey();
      if (!totals[today]) {
        totals[today] = emptyTotals();
      }
      totals[today].studySec += currentStudySeconds();
    }

    return totals;
  }

  function emptyTotals() {
    return {
      studySec: 0,
      earnedBreakSec: 0,
      actualBreakSec: 0,
      sessions: 0
    };
  }

  function calculateStreaks(totals) {
    const today = dateKey();
    const studyQualified = (key) => {
      const total = totals[key]?.studySec || 0;
      return total >= STREAK_STUDY_SECONDS
        || state.streak.scheduledGraceDays.includes(key)
        || state.streak.restoredDays.includes(key);
    };
    const oneHourQualified = (key) => (totals[key]?.studySec || 0) >= UNLOCK_STUDY_SECONDS;

    return {
      current: countCurrentStreak(today, studyQualified),
      oneHourCurrent: countCurrentStreak(today, oneHourQualified)
    };
  }

  function countCurrentStreak(today, qualifies) {
    let cursor = qualifies(today) ? today : addDays(today, -1);
    let count = 0;

    while (qualifies(cursor)) {
      count += 1;
      cursor = addDays(cursor, -1);
    }

    return count;
  }

  function recalculateAndStoreStreaks(allowAwards) {
    const totals = getDailyTotals(false);
    const streakInfo = calculateStreaks(totals);
    state.streak.current = streakInfo.current;
    state.streak.oneHourCurrent = streakInfo.oneHourCurrent;
    state.streak.best = Math.max(state.streak.best, streakInfo.current);
    state.streak.oneHourBest = Math.max(state.streak.oneHourBest, streakInfo.oneHourCurrent);

    if (allowAwards) {
      const today = dateKey();
      if (streakInfo.current > 0 && streakInfo.current % 7 === 0 && !state.streak.graceAwardedDates.includes(today)) {
        state.streak.graceTokens += 2;
        state.streak.graceAwardedDates.push(today);
        toast("Grace days earned", "You earned 2 grace days for reaching a 7-day streak.");
      }

      if (!state.streak.unlockAchieved && streakInfo.oneHourCurrent >= 7) {
        state.streak.unlockAchieved = true;
        toast("Break tools unlocked", "Bank spending and manual break adjustments are now available.");
      }
    }
  }

  function saveGoals() {
    const studyGoal = Number.parseInt(els.studyGoalInput.value, 10);
    const sessionGoal = Number.parseInt(els.sessionGoalInput.value, 10);
    state.goals.studyMinutes = Number.isFinite(studyGoal) && studyGoal > 0 ? studyGoal : null;
    state.goals.sessions = Number.isFinite(sessionGoal) && sessionGoal > 0 ? sessionGoal : null;
    setStatus("Daily goals saved.");
    render();
    persist();
  }

  function goalSummary(todayTotals) {
    const parts = [];
    if (state.goals.studyMinutes) {
      parts.push(`${Math.min(100, goalPercent(todayTotals.studySec, state.goals.studyMinutes * 60))}% study`);
    }
    if (state.goals.sessions) {
      parts.push(`${Math.min(100, goalPercent(todayTotals.sessions, state.goals.sessions))}% sessions`);
    }
    return parts.length ? parts.join(" · ") : "Not set";
  }

  function goalPercent(value, target) {
    if (!target) {
      return 0;
    }
    return Math.round(clamp((value / target) * 100, 0, 100));
  }

  function saveCustomPreset() {
    const preset = {
      id: "custom",
      name: "Custom Mode",
      minStudySec: minutesFromInput(els.customMinStudy, PAKO_PRESET.minStudySec / 60) * 60,
      firstBreakSec: minutesFromInput(els.customFirstBreak, PAKO_PRESET.firstBreakSec / 60) * 60,
      secondThresholdSec: minutesFromInput(els.customSecondThreshold, PAKO_PRESET.secondThresholdSec / 60) * 60,
      secondBreakSec: minutesFromInput(els.customSecondBreak, PAKO_PRESET.secondBreakSec / 60) * 60,
      bonusStartSec: minutesFromInput(els.customBonusStart, PAKO_PRESET.bonusStartSec / 60) * 60,
      bonusBlockSec: minutesFromInput(els.customBonusBlock, PAKO_PRESET.bonusBlockSec / 60) * 60,
      bonusBreakSec: minutesFromInput(els.customBonusBreak, PAKO_PRESET.bonusBreakSec / 60) * 60
    };

    if (preset.secondThresholdSec <= preset.minStudySec || preset.bonusStartSec < preset.secondThresholdSec) {
      toast("Check the rules", "Thresholds need to increase from minimum study to bonus start.");
      return;
    }

    state.customPreset = preset;
    state.settings.activePresetId = "custom";
    populatePresetSelect();
    populatePresetFields(preset);
    setStatus("Custom preset saved.");
    render();
    persist();
  }

  function changePreset() {
    state.settings.activePresetId = els.presetSelect.value;
    populatePresetFields(getActivePreset());
    setStatus(`${getActivePreset().name} is active.`);
    render();
    persist();
  }

  function minutesFromInput(input, fallback) {
    const value = Number.parseInt(input.value, 10);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  function openSettings() {
    populateSettingsFields();
    els.settingsPanel.classList.add("open");
    els.settingsPanel.setAttribute("aria-hidden", "false");
    els.settingsBackdrop.hidden = false;
  }

  function closeSettings() {
    els.settingsPanel.classList.remove("open");
    els.settingsPanel.setAttribute("aria-hidden", "true");
    els.settingsBackdrop.hidden = true;
  }

  function populateSettingsFields() {
    populatePresetSelect();
    populatePresetFields(getActivePreset());
    els.studyGoalInput.value = state.goals.studyMinutes || "";
    els.sessionGoalInput.value = state.goals.sessions || "";
    els.soundSelect.value = state.settings.sound;
    els.volumeSlider.value = state.settings.volume;
    els.graceDateInput.min = addDays(dateKey(), 1);
  }

  function populatePresetSelect() {
    els.presetSelect.innerHTML = `
      <option value="pako">Pako Mode</option>
      ${state.customPreset ? `<option value="custom">Custom Mode</option>` : ""}
    `;
    els.presetSelect.value = state.settings.activePresetId === "custom" && state.customPreset ? "custom" : "pako";
  }

  function populatePresetFields(preset) {
    els.customMinStudy.value = preset.minStudySec / 60;
    els.customFirstBreak.value = preset.firstBreakSec / 60;
    els.customSecondThreshold.value = preset.secondThresholdSec / 60;
    els.customSecondBreak.value = preset.secondBreakSec / 60;
    els.customBonusStart.value = preset.bonusStartSec / 60;
    els.customBonusBlock.value = preset.bonusBlockSec / 60;
    els.customBonusBreak.value = preset.bonusBreakSec / 60;
  }

  function changeSound() {
    state.settings.sound = els.soundSelect.value;
    render();
    persist();
  }

  function uploadSound() {
    const file = els.soundUpload.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 2_500_000) {
      toast("Sound too large", "Use a short audio file under 2.5 MB for browser storage.");
      els.soundUpload.value = "";
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      state.settings.customSoundDataUrl = String(reader.result);
      state.settings.sound = "custom";
      els.soundSelect.value = "custom";
      setStatus("Custom alarm sound saved on this browser.");
      persist();
    });
    reader.readAsDataURL(file);
  }

  function changeVolume() {
    state.settings.volume = Number.parseFloat(els.volumeSlider.value);
    persist();
  }

  function enableNotifications() {
    if (!("Notification" in window)) {
      toast("Notifications unavailable", "This browser does not support page notifications.");
      return;
    }

    Notification.requestPermission().then((permission) => {
      state.settings.notificationsEnabled = permission === "granted";
      toast("Notifications", permission === "granted" ? "Browser notifications are enabled." : "Notifications were not enabled.");
      render();
      persist();
    });
  }

  function notificationStatusText() {
    if (!("Notification" in window)) {
      return "Browser notifications are not supported here.";
    }
    if (Notification.permission === "granted" && state.settings.notificationsEnabled) {
      return "Browser notifications are enabled.";
    }
    if (Notification.permission === "denied") {
      return "Browser notifications are blocked in this browser.";
    }
    return "Browser notifications are optional and stay on this device.";
  }

  function scheduleGraceDay() {
    const selected = els.graceDateInput.value;
    const tomorrow = addDays(dateKey(), 1);

    if (!selected || selected < tomorrow) {
      toast("Schedule ahead", "Grace days must be scheduled before the missed day.");
      return;
    }

    if (state.streak.graceTokens <= 0) {
      toast("No grace days", "Earn grace days by reaching 7-day streaks.");
      return;
    }

    if (state.streak.scheduledGraceDays.includes(selected)) {
      toast("Already scheduled", "That date already has a grace day.");
      return;
    }

    state.streak.graceTokens -= 1;
    state.streak.scheduledGraceDays.push(selected);
    toast("Grace day scheduled", `${selected} is protected.`);
    render();
    persist();
  }

  function restoreYesterday() {
    const yesterday = addDays(dateKey(), -1);
    const totals = getDailyTotals(false);

    if (state.streak.restoreTokens <= 0) {
      toast("No restores left", "You have used all 3 streak restores.");
      return;
    }

    if ((totals[yesterday]?.studySec || 0) >= STREAK_STUDY_SECONDS || state.streak.restoredDays.includes(yesterday)) {
      toast("Restore not needed", "Yesterday already counts for your streak.");
      return;
    }

    state.streak.restoreTokens -= 1;
    state.streak.restoredDays.push(yesterday);
    recalculateAndStoreStreaks(false);
    toast("Streak restored", "Yesterday now counts as a restored streak day.");
    render();
    persist();
  }

  function explainBankUse() {
    if (state.bankSec <= 0) {
      toast("Break bank empty", "End a break early to save unused minutes.");
      return;
    }

    if (!state.streak.unlockAchieved) {
      toast("Break bank locked", "Spending banked break time unlocks after a 7-day 1-hour streak.");
      return;
    }

    toast("Break bank ready", "Choose how many banked minutes to spend when you click Take Break.");
  }

  function exportData() {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `StudyTimerNiPako-${dateKey()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function importData() {
    const file = els.importInput.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      try {
        state = normalizeState(JSON.parse(String(reader.result)));
        recalculateAndStoreStreaks(false);
        populateSettingsFields();
        render();
        persist();
        toast("Data imported", "Your local StudyTimerNiPako data was restored.");
      } catch {
        toast("Import failed", "That file does not look like a valid backup.");
      } finally {
        els.importInput.value = "";
      }
    });
    reader.readAsText(file);
  }

  function clearData() {
    if (!window.confirm("Clear all local StudyTimerNiPako data? This cannot be undone unless you exported a backup.")) {
      return;
    }

    stopAlarm();
    localStorage.removeItem(STORAGE_KEY);
    state = defaultState();
    populateSettingsFields();
    setStatus("All local data was cleared.");
    render();
  }

  function toggleTheme() {
    state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
    applyTheme();
    persist();
  }

  function applyTheme() {
    document.documentElement.dataset.theme = state.settings.theme;
    els.themeToggle.textContent = state.settings.theme === "dark" ? "☀" : "◐";
    els.themeToggle.title = state.settings.theme === "dark" ? "Use light theme" : "Use dark theme";
  }

  function checkBreakWarnings(remainingSec) {
    for (const mark of WARNING_MARKS) {
      if (state.breakDurationSec > mark && remainingSec <= mark && !state.warningMarks.includes(mark)) {
        state.warningMarks.push(mark);
        notifyUser("Break reminder", `${formatDuration(mark)} left before study time.`);
        playWarningSound();
      }
    }
  }

  function checkWellnessReminder() {
    const studySec = currentStudySeconds();
    if (studySec < WELLNESS_START_SECONDS) {
      return;
    }

    const mark = WELLNESS_START_SECONDS
      + Math.floor((studySec - WELLNESS_START_SECONDS) / WELLNESS_INTERVAL_SECONDS) * WELLNESS_INTERVAL_SECONDS;

    if (!state.wellnessMarks.includes(mark)) {
      state.wellnessMarks.push(mark);
      toast("Long study check", "Boss, pahinga rin pag kaya. Long study sessions are good, but don't burn yourself out.");
    }
  }

  function activateBreakFinishedAlarm() {
    notifyUser("Break finished", BREAK_DONE_MESSAGE);
    setStatus(BREAK_DONE_MESSAGE);

    if (typeof els.alarmDialog.showModal === "function" && !els.alarmDialog.open) {
      els.alarmDialog.showModal();
    }

    playSelectedSound(true);
    window.setTimeout(() => {
      alarmClickArmed = true;
    }, 250);
  }

  function handleAlarmClick() {
    if (state.alarmActive && alarmClickArmed) {
      dismissAlarm();
    }
  }

  function dismissAlarm() {
    if (!state.alarmActive && !alarmInterval && !alarmAudio) {
      return;
    }

    stopAlarm();
    state.alarmActive = false;
    alarmClickArmed = false;

    if (els.alarmDialog.open) {
      els.alarmDialog.close();
    }

    render();
    persist();
  }

  function playSelectedSound(loop) {
    stopAlarm();

    if (state.settings.sound === "custom" && state.settings.customSoundDataUrl) {
      alarmAudio = new Audio(state.settings.customSoundDataUrl);
      alarmAudio.volume = clamp(state.settings.volume, 0, 1);
      alarmAudio.loop = loop;
      alarmAudio.play().catch(() => {
        toast("Sound blocked", "Click the page once, then try testing the sound again.");
      });
      return;
    }

    playSoundPattern(state.settings.sound);

    if (loop) {
      alarmInterval = window.setInterval(() => playSoundPattern(state.settings.sound), 2500);
    }
  }

  function playWarningSound() {
    playSoundPattern("softPulse");
  }

  function playSoundPattern(soundName) {
    const context = getAudioContext();
    if (!context) {
      return;
    }

    if (context.state === "suspended") {
      context.resume().catch(() => undefined);
    }

    const volume = clamp(state.settings.volume, 0, 1);
    const now = context.currentTime;

    if (soundName === "deskChime") {
      tone(context, 523.25, now, 0.16, volume);
      tone(context, 659.25, now + 0.18, 0.2, volume * 0.9);
      tone(context, 783.99, now + 0.4, 0.26, volume * 0.8);
      return;
    }

    if (soundName === "softPulse") {
      tone(context, 392, now, 0.18, volume * 0.75, "triangle");
      tone(context, 392, now + 0.32, 0.18, volume * 0.75, "triangle");
      return;
    }

    tone(context, 440, now, 0.2, volume, "sine");
    tone(context, 554.37, now + 0.24, 0.24, volume * 0.9, "sine");
  }

  function tone(context, frequency, start, duration, volume, type = "sine") {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * 0.18), start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }

  function getAudioContext() {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        toast("Sound unavailable", "This browser does not support generated alarm sounds.");
        return null;
      }
      audioContext = new AudioContextClass();
    }
    return audioContext;
  }

  function stopAlarm() {
    if (alarmInterval) {
      window.clearInterval(alarmInterval);
      alarmInterval = null;
    }

    if (alarmAudio) {
      alarmAudio.pause();
      alarmAudio.currentTime = 0;
      alarmAudio = null;
    }
  }

  function notifyUser(title, body) {
    toast(title, body);

    if (!state.settings.notificationsEnabled || !("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    try {
      new Notification(title, { body });
    } catch {
      // Browser notification failures should not interrupt the timer.
    }
  }

  function toast(title, message) {
    const item = document.createElement("div");
    item.className = "toast";
    item.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(message)}</span>`;
    els.toastStack.appendChild(item);
    window.setTimeout(() => {
      item.remove();
    }, 5200);
  }

  function setStatus(message) {
    els.statusMessage.textContent = message;
  }

  function formatClock(totalSeconds) {
    const seconds = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map((part) => String(part).padStart(2, "0")).join(":");
  }

  function formatDuration(totalSeconds) {
    const seconds = Math.max(0, Math.round(totalSeconds));
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0 && m > 0) {
      return `${h}h ${m}m`;
    }
    if (h > 0) {
      return `${h}h`;
    }
    if (m > 0) {
      return `${m}m`;
    }
    return `${s}s`;
  }

  function dateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function addDays(key, amount) {
    const date = parseDateKey(key);
    date.setDate(date.getDate() + amount);
    return dateKey(date);
  }

  function parseDateKey(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
