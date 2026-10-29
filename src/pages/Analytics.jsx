import { useEffect, useState, useRef } from "react";
import { useAppContext } from "../AppContext";
import { ChevronLeft, ChevronRight, X, ChevronDown } from "lucide-react";

export default function Analytics() {
  const { monthlyBudget, monthlyIncomeGoal, cycleStartDay, theme, categories } =
    useAppContext();
  const [transactions, setTransactions] = useState([]);
  const [timeFilter, setTimeFilter] = useState("month");
  const [typeFilter, setTypeFilter] = useState("expense");
  const [offset, setOffset] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [catViewMode, setCatViewMode] = useState("limit");
  const [catLimits, setCatLimits] = useState({});
  const [monthlyCatLimits, setMonthlyCatLimits] = useState({});
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitScope, setLimitScope] = useState("all");
  const [limitForm, setLimitForm] = useState({ categoryId: null, amount: "0" });
  const [limitMonthKey, setLimitMonthKey] = useState("");
  const [limitYear, setLimitYear] = useState(new Date().getFullYear());
  const [saveLimitSuccess, setSaveLimitSuccess] = useState(false);
  const [, setGoalsTrigger] = useState(0);
  const rawDataRef = useRef({ tx: "", goals: "", limits: "", mLimits: "" });
  const detailContainerRef = useRef(null);
  const limitModalRef = useRef(null);

  useEffect(() => {
    const loadData = () => {
      const txRaw = localStorage.getItem("vys_transactions") || "[]";
      if (txRaw !== rawDataRef.current.tx) {
        rawDataRef.current.tx = txRaw;
        setTransactions(JSON.parse(txRaw));
      }
      const combinedGoals =
        (localStorage.getItem("vys_monthly_goals") || "{}") +
        (localStorage.getItem("vys_global_goals") || "{}");
      if (combinedGoals !== rawDataRef.current.goals) {
        rawDataRef.current.goals = combinedGoals;
        setGoalsTrigger((prev) => prev + 1);
      }
      const limitsRaw = localStorage.getItem("vys_category_limits") || "{}";
      if (limitsRaw !== rawDataRef.current.limits) {
        rawDataRef.current.limits = limitsRaw;
        setCatLimits(JSON.parse(limitsRaw));
      }
      const mLimitsRaw =
        localStorage.getItem("vys_monthly_category_limits") || "{}";
      if (mLimitsRaw !== rawDataRef.current.mLimits) {
        rawDataRef.current.mLimits = mLimitsRaw;
        setMonthlyCatLimits(JSON.parse(mLimitsRaw));
      }
    };
    loadData();
    const interval = setInterval(loadData, 500);
    return () => clearInterval(interval);
  }, []);

  const getPeriodBounds = () => {
    const base = new Date();
    let start, end, label, monthKey;
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    if (timeFilter === "week") {
      const targetDate = new Date(
        base.getFullYear(),
        base.getMonth(),
        base.getDate(),
      );
      targetDate.setDate(targetDate.getDate() + offset * 7);
      const dayOfWeek = targetDate.getDay();
      const distToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start = new Date(targetDate);
      start.setDate(targetDate.getDate() - distToMonday);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 7);
      let endLabel = new Date(end);
      endLabel.setDate(endLabel.getDate() - 1);
      label = `${months[start.getMonth()]} ${start.getDate()} - ${months[endLabel.getMonth()]} ${endLabel.getDate()}`;
    } else if (timeFilter === "month") {
      let currentStart = new Date(
        base.getFullYear(),
        base.getMonth(),
        cycleStartDay,
      );
      if (base.getDate() < cycleStartDay)
        currentStart.setMonth(currentStart.getMonth() - 1);
      currentStart.setMonth(currentStart.getMonth() + offset);
      start = new Date(currentStart);
      end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      monthKey = `${start.getFullYear()}-${(start.getMonth() + 1).toString().padStart(2, "0")}`;
      if (cycleStartDay === 1)
        label = `${months[start.getMonth()]} ${start.getFullYear()}`;
      else {
        let endLabel = new Date(end);
        endLabel.setDate(endLabel.getDate() - 1);
        label = `${months[start.getMonth()]} ${start.getDate()} - ${months[endLabel.getMonth()]} ${endLabel.getDate()}`;
      }
    } else {
      base.setFullYear(base.getFullYear() + offset);
      start = new Date(base.getFullYear(), 0, 1);
      end = new Date(base.getFullYear() + 1, 0, 1);
      label = `${start.getFullYear()}`;
    }
    return { start, end, label, monthKey };
  };

  const bounds = getPeriodBounds();
  let currentBudget = 0;
  let currentIncomeGoal = 0;
  try {
    const glob = JSON.parse(localStorage.getItem("vys_global_goals") || "{}");
    const mGoals = JSON.parse(
      localStorage.getItem("vys_monthly_goals") || "{}",
    );
    let autoSum = 0;
    if (timeFilter === "month" && bounds.monthKey) {
      const currentLocalLimits = monthlyCatLimits[bounds.monthKey] || {};
      const allCategoryIds = new Set([
        ...Object.keys(catLimits),
        ...Object.keys(currentLocalLimits),
      ]);
      allCategoryIds.forEach((catId) => {
        const activeVal =
          currentLocalLimits[catId] !== undefined
            ? currentLocalLimits[catId]
            : catLimits[catId];
        autoSum += Number(activeVal) || 0;
      });
    }
    if (timeFilter === "month") {
      if (
        mGoals[bounds.monthKey] &&
        mGoals[bounds.monthKey].budget !== undefined
      )
        currentBudget = Number(mGoals[bounds.monthKey].budget);
      else if (autoSum > 0) currentBudget = autoSum;
      else
        currentBudget = Number(
          glob.expense || glob.budget || monthlyBudget || 0,
        );
      if (
        mGoals[bounds.monthKey] &&
        mGoals[bounds.monthKey].income !== undefined
      )
        currentIncomeGoal = Number(mGoals[bounds.monthKey].income);
      else
        currentIncomeGoal = Number(
          glob.incomeGoal || glob.income || monthlyIncomeGoal || 0,
        );
    } else {
      currentBudget = Number(glob.expense || glob.budget || monthlyBudget || 0);
      currentIncomeGoal = Number(
        glob.incomeGoal || glob.income || monthlyIncomeGoal || 0,
      );
    }
  } catch (e) {}

  const filteredData = transactions.filter((tItem) => {
    if (tItem.type !== typeFilter || !tItem.date) return false;
    const d = new Date(tItem.date.replace(" ", "T"));
    return d >= bounds.start && d < bounds.end;
  });

  const formatGroupHeader = (d) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) return "TODAY";
    const days = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];
    const months = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];
    let header = `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
    if (timeFilter === "year") header += `, ${d.getFullYear()}`;
    return header;
  };

  const openDetail = (cat) => {
    setSelectedCategory(cat);
    setTimeout(() => setShowDetail(true), 10);
  };
  const closeDetail = () => {
    setShowDetail(false);
    setTimeout(() => setSelectedCategory(null), 300);
  };

  // Swipe for Detail
  useEffect(() => {
    const container = detailContainerRef.current;
    if (!container || !showDetail) return;
    let startY = 0,
      startX = 0,
      currentY = 0,
      isDragging = false,
      isClosing = false,
      dragDirection = null,
      rafId = null;
    const handleTouchStart = (e) => {
      if (container.scrollTop > 0 || isClosing) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isDragging = true;
      dragDirection = null;
      container.style.transition = "none";
    };
    const handleTouchMove = (e) => {
      if (!isDragging || isClosing) return;
      const diffX = e.touches[0].clientX - startX,
        diffY = e.touches[0].clientY - startY;
      if (!dragDirection) {
        if (Math.abs(diffX) > Math.abs(diffY)) dragDirection = "horizontal";
        else dragDirection = "vertical";
      }
      if (dragDirection === "horizontal") return;
      if (
        dragDirection === "vertical" &&
        diffY > 0 &&
        container.scrollTop <= 0
      ) {
        e.preventDefault();
        currentY = diffY;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          container.style.transform = `translate3d(0, ${currentY}px, 0)`;
        });
      }
    };
    const handleTouchEnd = () => {
      if (!isDragging || isClosing) return;
      isDragging = false;
      if (rafId) cancelAnimationFrame(rafId);
      container.style.transition =
        "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)";
      if (currentY > 150) {
        isClosing = true;
        container.style.transform = `translate3d(0, 100dvh, 0)`;
        closeDetail();
        setTimeout(() => {
          container.style.transform = "";
        }, 300);
      } else {
        currentY = 0;
        container.style.transform = `translate3d(0, 0px, 0)`;
      }
    };
    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd);
    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [showDetail]);

  // Swipe for Limit Modal
  useEffect(() => {
    const container = limitModalRef.current;
    if (!container || !showLimitModal) return;
    let startY = 0,
      startX = 0,
      currentY = 0,
      isDragging = false,
      isClosing = false,
      dragDirection = null,
      rafId = null;
    const handleTouchStart = (e) => {
      if (container.scrollTop > 0 || isClosing) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isDragging = true;
      dragDirection = null;
      container.style.transition = "none";
    };
    const handleTouchMove = (e) => {
      if (!isDragging || isClosing) return;
      const diffX = e.touches[0].clientX - startX,
        diffY = e.touches[0].clientY - startY;
      if (!dragDirection) {
        if (Math.abs(diffX) > Math.abs(diffY)) dragDirection = "horizontal";
        else dragDirection = "vertical";
      }
      if (dragDirection === "horizontal") return;
      if (
        dragDirection === "vertical" &&
        diffY > 0 &&
        container.scrollTop <= 0
      ) {
        e.preventDefault();
        currentY = diffY;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          container.style.transform = `translate3d(0, ${currentY}px, 0)`;
        });
      }
    };
    const handleTouchEnd = () => {
      if (!isDragging || isClosing) return;
      isDragging = false;
      if (rafId) cancelAnimationFrame(rafId);
      container.style.transition =
        "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)";
      if (currentY > 150) {
        isClosing = true;
        container.style.transform = `translate3d(0, 100dvh, 0)`;
        setTimeout(() => closeLimitModal(), 300);
      } else {
        currentY = 0;
        container.style.transform = `translate3d(0, 0px, 0)`;
      }
    };
    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd);
    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [showLimitModal]);

  let totalAmount = 0;
  let catMap = {};
  filteredData.forEach((item) => {
    totalAmount += item.amount;
    if (item.category) {
      const catId = item.category.id;
      if (!catMap[catId]) catMap[catId] = { ...item.category, spent: 0 };
      catMap[catId].spent += item.amount;
    }
  });
  const categoryData = Object.values(catMap)
    .map((cat) => ({
      ...cat,
      percent: totalAmount > 0 ? (cat.spent / totalAmount) * 100 : 0,
    }))
    .sort((a, b) => b.spent - a.spent);
  const budgetLeft =
    typeFilter === "expense"
      ? currentBudget - totalAmount
      : currentIncomeGoal - totalAmount;
  const isCurrentPeriod = offset === 0;
  const now = new Date();
  const daysInCycle = Math.round((bounds.end - bounds.start) / 86400000);
  const pastData = filteredData.filter(
    (item) => new Date(item.date.replace(" ", "T")) <= now,
  );
  const totalAmountPast = pastData.reduce((sum, item) => sum + item.amount, 0);
  const futureDataTotal = totalAmount - totalAmountPast;
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const periodStart = new Date(
    bounds.start.getFullYear(),
    bounds.start.getMonth(),
    bounds.start.getDate(),
  );
  let daysPassed = Math.round((todayStart - periodStart) / 86400000) + 1;
  if (daysPassed > daysInCycle) daysPassed = daysInCycle;
  if (daysPassed < 1) daysPassed = 1;
  const dailyAverage = totalAmountPast / daysPassed;
  const onPaceFor = isCurrentPeriod
    ? dailyAverage * daysInCycle + futureDataTotal
    : totalAmount;
  const pacePercent = (daysPassed / daysInCycle) * 100;

  const catTransactions = selectedCategory
    ? filteredData.filter((t) => t.category?.id === selectedCategory.id)
    : [];
  catTransactions.sort(
    (a, b) =>
      new Date(b.date.replace(" ", "T")) - new Date(a.date.replace(" ", "T")),
  );
  const catTotal = catTransactions.reduce((sum, t) => sum + t.amount, 0);

  const groupedDetailData = catTransactions.reduce((acc, tran) => {
    const d = tran.date ? new Date(tran.date.replace(" ", "T")) : new Date();
    d.setHours(0, 0, 0, 0);
    const dateKey = d.toISOString();
    if (!acc[dateKey]) acc[dateKey] = { date: d, items: [], totalDay: 0 };
    acc[dateKey].items.push(tran);
    acc[dateKey].totalDay += tran.amount;
    return acc;
  }, {});
  const sortedDetailGroups = Object.values(groupedDetailData).sort(
    (a, b) => b.date - a.date,
  );

  const isLimitApplicable = typeFilter === "expense" && timeFilter === "month";
  const currentViewMode = isLimitApplicable ? catViewMode : "percent";

  const loadFormForCat = (
    catId,
    mKey = limitMonthKey,
    preserveScope = false,
  ) => {
    setSaveLimitSuccess(false);
    const localLimit = monthlyCatLimits[mKey]?.[catId];
    const globalLimit = catLimits[catId];
    let amountToSet = "0";
    let newScope = preserveScope ? limitScope : "month";
    if (localLimit !== undefined) {
      amountToSet = localLimit.toString().replace(".", ",");
      if (!preserveScope) newScope = "month";
    } else if (globalLimit !== undefined) {
      amountToSet = globalLimit.toString().replace(".", ",");
      if (!preserveScope) newScope = "all";
    }
    setLimitForm({ categoryId: catId, amount: amountToSet });
    setLimitScope(newScope);
  };

  const openLimitModal = () => {
    setSaveLimitSuccess(false);
    let mKey = bounds.monthKey;
    if (!mKey) {
      const d = new Date();
      mKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    }
    setLimitMonthKey(mKey);
    setLimitYear(parseInt(mKey.split("-")[0])); // Lấy năm của tháng hiện tại
    const activeCats = categories.filter((c) => c.type === typeFilter);
    if (activeCats.length > 0) loadFormForCat(activeCats[0].id, mKey, false);
    setShowLimitModal(true);
  };

  const closeLimitModal = () => {
    setShowLimitModal(false);
    setSaveLimitSuccess(false);
  };

  const handlePrevYear = () => {
    setLimitYear((y) => {
      const newY = y - 1;
      if (limitMonthKey) {
        const currentMonth = limitMonthKey.split("-")[1];
        const newKey = `${newY}-${currentMonth}`;
        setLimitMonthKey(newKey);
        loadFormForCat(limitForm.categoryId, newKey, true);
      }
      return newY;
    });
  };

  const handleNextYear = () => {
    setLimitYear((y) => {
      const newY = y + 1;
      if (limitMonthKey) {
        const currentMonth = limitMonthKey.split("-")[1];
        const newKey = `${newY}-${currentMonth}`;
        setLimitMonthKey(newKey);
        loadFormForCat(limitForm.categoryId, newKey, true);
      }
      return newY;
    });
  };

  const handleSaveLimit = () => {
    if (!limitForm.categoryId) return;
    const numericAmount = Number(limitForm.amount.toString().replace(",", "."));
    const targetMonthKey = limitMonthKey;

    if (numericAmount === 0) {
      const newGlobalLimits = { ...catLimits };
      delete newGlobalLimits[limitForm.categoryId];
      setCatLimits(newGlobalLimits);
      localStorage.setItem(
        "vys_category_limits",
        JSON.stringify(newGlobalLimits),
      );
      const newMonthlyLimits = { ...monthlyCatLimits };
      if (newMonthlyLimits[targetMonthKey]) {
        delete newMonthlyLimits[targetMonthKey][limitForm.categoryId];
        if (Object.keys(newMonthlyLimits[targetMonthKey]).length === 0)
          delete newMonthlyLimits[targetMonthKey];
        setMonthlyCatLimits(newMonthlyLimits);
        localStorage.setItem(
          "vys_monthly_category_limits",
          JSON.stringify(newMonthlyLimits),
        );
      }
    } else if (limitScope === "month") {
      const newMonthlyLimits = { ...monthlyCatLimits };
      if (!newMonthlyLimits[targetMonthKey])
        newMonthlyLimits[targetMonthKey] = {};
      newMonthlyLimits[targetMonthKey][limitForm.categoryId] = numericAmount;
      setMonthlyCatLimits(newMonthlyLimits);
      localStorage.setItem(
        "vys_monthly_category_limits",
        JSON.stringify(newMonthlyLimits),
      );
    } else if (limitScope === "future") {
      const newMonthlyLimits = { ...monthlyCatLimits };
      let [year, month] = targetMonthKey.split("-").map(Number);
      for (let i = 0; i < 24; i++) {
        let mStr = month.toString().padStart(2, "0");
        let key = `${year}-${mStr}`;
        if (!newMonthlyLimits[key]) newMonthlyLimits[key] = {};
        newMonthlyLimits[key][limitForm.categoryId] = numericAmount;
        month++;
        if (month > 12) {
          month = 1;
          year++;
        }
      }
      setMonthlyCatLimits(newMonthlyLimits);
      localStorage.setItem(
        "vys_monthly_category_limits",
        JSON.stringify(newMonthlyLimits),
      );
    } else {
      const newGlobalLimits = { ...catLimits };
      newGlobalLimits[limitForm.categoryId] = numericAmount;
      setCatLimits(newGlobalLimits);
      localStorage.setItem(
        "vys_category_limits",
        JSON.stringify(newGlobalLimits),
      );
      const newMonthlyLimits = { ...monthlyCatLimits };
      if (
        newMonthlyLimits[targetMonthKey] &&
        newMonthlyLimits[targetMonthKey][limitForm.categoryId] !== undefined
      ) {
        delete newMonthlyLimits[targetMonthKey][limitForm.categoryId];
        if (Object.keys(newMonthlyLimits[targetMonthKey]).length === 0)
          delete newMonthlyLimits[targetMonthKey];
        setMonthlyCatLimits(newMonthlyLimits);
        localStorage.setItem(
          "vys_monthly_category_limits",
          JSON.stringify(newMonthlyLimits),
        );
      }
    }
    setSaveLimitSuccess(true);
    setTimeout(() => setSaveLimitSuccess(false), 2500);
  };

  const formatDisplayAmount = (val) => {
    if (!val || val === "0") return "";
    const parts = val.toString().split(",");
    return parts.length > 1
      ? `${parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${parts[1]}`
      : parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Helper format thu gọn chữ số Limit vào box (VD: 500000 -> 500K)
  const formatCompact = (val) => {
    if (!val) return "";
    const num = Number(val);
    if (num >= 1000000000)
      return (num / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
    if (num >= 1000000)
      return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return num.toString();
  };

  const globalGroupedData = filteredData.reduce((acc, tran) => {
    const d = new Date(tran.date.replace(" ", "T"));
    d.setHours(0, 0, 0, 0);
    const dateKey = d.getTime();
    if (!acc[dateKey]) acc[dateKey] = 0;
    acc[dateKey] += tran.amount;
    return acc;
  }, {});
  const sparklineData = [];
  const iterDate = new Date(bounds.start);
  iterDate.setHours(0, 0, 0, 0);
  const endIterDate = isCurrentPeriod ? new Date() : new Date(bounds.end);
  if (isCurrentPeriod) endIterDate.setHours(23, 59, 59, 999);
  while (iterDate <= endIterDate) {
    sparklineData.push(globalGroupedData[iterDate.getTime()] || 0);
    iterDate.setDate(iterDate.getDate() + 1);
  }
  let sparklinePoints = "";
  if (sparklineData.length > 1) {
    const maxVal = Math.max(...sparklineData, 1);
    sparklinePoints = sparklineData
      .map((val, idx) => {
        const x = (idx / (sparklineData.length - 1)) * 100;
        const y = 30 - (val / maxVal) * 20;
        return `${x},${y}`;
      })
      .join(" ");
  } else if (sparklineData.length === 1) sparklinePoints = "0,20 100,20";

  return (
    <>
      <div
        className={`h-[100dvh] w-full flex flex-col relative overflow-hidden animate-ios-page ${theme === "dark" ? "bg-black text-white" : "bg-[#f2f2f7] text-black"}`}
      >
        <div
          className={`flex-shrink-0 z-40 px-5 pb-2 pt-1 ${theme === "dark" ? "bg-black/90" : "bg-[#f2f2f7]/90"}`}
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
              <button
                onClick={() => setTypeFilter("expense")}
                className={`text-[22px] font-bold tracking-tight transition-colors ${typeFilter === "expense" ? (theme === "dark" ? "text-white" : "text-black") : "text-[#8e8e93]"}`}
              >
                Expense
              </button>
              <button
                onClick={() => setTypeFilter("income")}
                className={`text-[22px] font-bold tracking-tight transition-colors ${typeFilter === "income" ? (theme === "dark" ? "text-white" : "text-black") : "text-[#8e8e93]"}`}
              >
                Income
              </button>
            </div>
            <div
              className={`flex gap-1 p-1 rounded-full ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-gray-200"}`}
            >
              {[
                { id: "week", l: "Week" },
                { id: "month", l: "Month" },
                { id: "year", l: "Year" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setTimeFilter(f.id);
                    setOffset(0);
                  }}
                  className={`px-3 py-1.5 text-[12px] font-bold rounded-full transition-colors flex items-center justify-center ${timeFilter === f.id ? (theme === "dark" ? "bg-[#2c2c2e] text-white" : "bg-white text-black shadow-sm") : "text-[#8e8e93]"}`}
                >
                  {f.l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <button
              onClick={() => setOffset((o) => o - 1)}
              className="p-1 text-[#32ade6] active:opacity-50"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="relative font-bold text-[17px] tracking-wide">
              {bounds.label}
              {timeFilter === "year" ? (
                <select
                  className="absolute inset-0 w-full h-full opacity-0"
                  onChange={(e) => {
                    setOffset(
                      parseInt(e.target.value) - new Date().getFullYear(),
                    );
                    e.target.value = "";
                  }}
                >
                  <option value="">Select Year</option>
                  {[...Array(15)].map((_, i) => {
                    const y = new Date().getFullYear() - 7 + i;
                    return (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <input
                  type={timeFilter === "month" ? "month" : "date"}
                  className="absolute inset-0 w-full h-full opacity-0"
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const sd = new Date(e.target.value);
                    const td = new Date();
                    if (timeFilter === "month")
                      setOffset(
                        (sd.getFullYear() - td.getFullYear()) * 12 +
                          (sd.getMonth() - td.getMonth()),
                      );
                    else
                      setOffset(
                        Math.floor(Math.round((sd - td) / 86400000) / 7),
                      );
                    e.target.value = "";
                  }}
                />
              )}
            </div>
            <button
              onClick={() => setOffset((o) => o + 1)}
              className="p-1 text-[#32ade6] active:opacity-50"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto px-5 pt-3 pb-32 overscroll-y-auto scrollbar-hide"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div
            className={`rounded-3xl p-5 mb-6 border ${theme === "dark" ? "bg-[#1c1c1e] border-white/5 shadow-md" : "bg-white border-black/5 shadow-[0_4px_12px_rgba(0,0,0,0.03)]"}`}
          >
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-[13px] font-semibold text-[#8e8e93] mb-1">
                  {typeFilter === "expense" ? "Spent" : "Earned"}
                </p>
                <div className="text-[32px] font-bold tracking-tight leading-none">
                  ₫{totalAmount.toLocaleString("vi-VN")}
                </div>
              </div>
              {timeFilter === "month" && (
                <div className="text-right">
                  <p className="text-[13px] font-semibold text-[#8e8e93] mb-1">
                    Left
                  </p>
                  <div
                    className={`text-[17px] font-bold leading-none ${budgetLeft < 0 ? "text-[#ff453a]" : ""}`}
                  >
                    {budgetLeft < 0 ? "-" : ""}₫
                    {Math.abs(budgetLeft).toLocaleString("vi-VN")}
                  </div>
                </div>
              )}
            </div>
            <div className="h-12 relative w-full overflow-hidden mb-2">
              {sparklinePoints && (
                <svg
                  className={`absolute inset-0 w-full h-full ${theme === "dark" ? "text-gray-500" : "text-gray-300"}`}
                  viewBox="0 0 100 30"
                  preserveAspectRatio="none"
                >
                  <polyline
                    points={sparklinePoints}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            {isCurrentPeriod &&
              typeFilter === "expense" &&
              timeFilter === "month" && (
                <div
                  className={`mt-4 pt-3 border-t flex justify-between items-center ${theme === "dark" ? "border-white/10" : "border-black/5"}`}
                >
                  <span className="text-[13px] font-semibold text-[#8e8e93]">
                    On pace for{" "}
                    <span className="text-[#32ade6]">
                      ₫{Math.round(onPaceFor).toLocaleString("vi-VN")}
                    </span>
                  </span>
                  <span className="text-[12px] font-semibold text-[#8e8e93]">
                    ₫{Math.round(dailyAverage).toLocaleString("vi-VN")}/day
                  </span>
                </div>
              )}
            {isCurrentPeriod && timeFilter === "year" && (
              <div
                className={`mt-4 pt-3 border-t flex justify-between items-center ${theme === "dark" ? "border-white/10" : "border-black/5"}`}
              >
                <span className="text-[13px] font-semibold text-[#8e8e93]">
                  Year pace{" "}
                  <span className="text-[#32ade6]">
                    ₫{Math.round(onPaceFor).toLocaleString("vi-VN")}
                  </span>
                </span>
                <span className="text-[12px] font-semibold text-[#8e8e93]">
                  ₫{Math.round(onPaceFor / 12).toLocaleString("vi-VN")}/mo
                </span>
              </div>
            )}
          </div>

          <div
            className={`rounded-2xl px-5 pt-4 pb-2 border ${theme === "dark" ? "bg-[#1c1c1e] border-white/5 shadow-md" : "bg-white border-black/5 shadow-[0_4px_12px_rgba(0,0,0,0.03)]"}`}
          >
            <div className="flex justify-between items-center mb-4">
              {isLimitApplicable ? (
                <>
                  <button
                    onClick={() =>
                      setCatViewMode((m) =>
                        m === "percent" ? "limit" : "percent",
                      )
                    }
                    className="flex items-center gap-1 text-[#8e8e93] text-[13px] font-semibold active:opacity-60"
                  >
                    By category:{" "}
                    <span
                      className={theme === "dark" ? "text-white" : "text-black"}
                    >
                      {catViewMode === "percent" ? "% of total" : "Limits"}
                    </span>
                    <ChevronDown size={14} className="opacity-70 mt-[1px]" />
                  </button>
                  <button
                    onClick={openLimitModal}
                    className="text-[#32ade6] text-[13px] font-semibold active:opacity-60"
                  >
                    + Add limit
                  </button>
                </>
              ) : (
                <p className="text-[#8e8e93] text-[13px] font-semibold">
                  By category
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {categoryData.map((cat, idx) => {
                let displayPercent = cat.percent;
                let limitAmt = null;
                let isOver = false;
                if (currentViewMode === "limit") {
                  const activeLimit =
                    monthlyCatLimits[bounds.monthKey]?.[cat.id] ??
                    catLimits[cat.id];
                  if (activeLimit) {
                    limitAmt = activeLimit;
                    displayPercent = (cat.spent / limitAmt) * 100;
                    isOver = displayPercent > 100;
                  } else displayPercent = null;
                }
                return (
                  <div
                    key={cat.id}
                    onClick={() => openDetail(cat)}
                    className="relative py-2.5 cursor-pointer active:opacity-60 transition-opacity"
                  >
                    <div
                      className="absolute left-0 top-3 bottom-6 w-[3px] rounded-r-md"
                      style={{ backgroundColor: cat.color || "#32ade6" }}
                    ></div>
                    <div className="pl-4 pr-1">
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-3">
                          <span className="text-[20px]">{cat.icon}</span>
                          <div className="flex flex-col justify-center">
                            <span className="font-bold text-[15px] leading-tight">
                              {cat.name}
                            </span>
                            {currentViewMode === "limit" && limitAmt && (
                              <span className="text-[12px] font-medium text-[#8e8e93] leading-tight mt-0.5">
                                Limit: ₫{limitAmt.toLocaleString("vi-VN")}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="font-bold text-[15px]">
                          ₫{cat.spent.toLocaleString("vi-VN")}{" "}
                          <span className="text-[#8e8e93] font-normal ml-1 text-lg leading-none">
                            ›
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4 mt-1">
                        <div className="flex-1 h-1 relative flex items-center">
                          <div
                            className={`absolute inset-0 rounded-full overflow-hidden ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-200"}`}
                          >
                            {(currentViewMode === "percent" ||
                              displayPercent !== null) && (
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(displayPercent || 0, 100)}%`,
                                  backgroundColor: cat.color || "#32ade6",
                                }}
                              ></div>
                            )}
                          </div>
                          {currentViewMode === "limit" &&
                            limitAmt &&
                            isCurrentPeriod && (
                              <div
                                className={`absolute -top-1 -bottom-1 w-[2px] rounded-full z-10 shadow-sm ${theme === "dark" ? "bg-white" : "bg-black"}`}
                                style={{
                                  left: `calc(${Math.min(pacePercent, 100)}% - 1px)`,
                                }}
                              ></div>
                            )}
                        </div>
                        <span
                          className={`text-[12px] font-bold min-w-[32px] text-right ${isOver ? "text-[#ff453a]" : "text-[#8e8e93]"}`}
                        >
                          {currentViewMode === "percent"
                            ? `${Math.round(displayPercent)}%`
                            : displayPercent !== null
                              ? `${Math.round(displayPercent)}%`
                              : "—"}
                        </span>
                      </div>
                    </div>
                    {idx !== categoryData.length - 1 && (
                      <div
                        className={`absolute bottom-0 left-4 right-1 h-[1px] ${theme === "dark" ? "bg-white/5" : "bg-black/5"}`}
                      ></div>
                    )}
                  </div>
                );
              })}
              {categoryData.length === 0 && (
                <p className="text-center text-[#8e8e93] pb-4 pt-2 text-sm">
                  No data for this period.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showLimitModal && (
        <div
          ref={limitModalRef}
          className={`fixed inset-0 z-50 flex flex-col overflow-y-auto animate-ios-slide will-change-transform ${theme === "dark" ? "bg-black" : "bg-[#f2f2f7]"}`}
        >
          {/* Header với Drag Handle - Cụm này sẽ giữ cố định lúc trượt */}
          <div
            className={`flex-shrink-0 z-40 pb-3 px-4 flex flex-col items-center shadow-[0_1px_0_0_rgba(0,0,0,0.05)] ${theme === "dark" ? "bg-black/90 shadow-[0_1px_0_0_rgba(255,255,255,0.05)]" : "bg-[#f2f2f7]/90"}`}
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
          >
            <div
              className={`w-14 h-1.5 rounded-full mb-3 ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-300"}`}
            ></div>
            <div className="flex justify-between items-center w-full">
              <h2 className="font-bold text-[17px] text-center w-full absolute left-0 -z-10">
                Category Limit
              </h2>
            </div>
          </div>

          <div className="flex-1 px-4 pt-6 pb-32">
            {/* Chuyển năm */}
            <div className="flex justify-between items-center mb-6 px-4">
              <button
                onClick={handlePrevYear}
                className={`p-2 text-[#32ade6] active:opacity-50 rounded-full transition-colors ${theme === "dark" ? "bg-[#32ade6]/20" : "bg-[#32ade6]/10"}`}
              >
                <ChevronLeft size={20} />
              </button>
              <span className="font-bold text-[20px] tracking-tight">
                {limitYear}
              </span>
              <button
                onClick={handleNextYear}
                className={`p-2 text-[#32ade6] active:opacity-50 rounded-full transition-colors ${theme === "dark" ? "bg-[#32ade6]/20" : "bg-[#32ade6]/10"}`}
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Thanh cuộn Category */}
            <div className="flex overflow-x-auto flex-nowrap gap-2.5 mb-6 pb-2 scrollbar-hide items-center min-h-[50px]">
              {categories
                .filter((c) => c.type === typeFilter)
                .map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => loadFormForCat(cat.id, limitMonthKey, false)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all border flex-shrink-0 ${limitForm.categoryId === cat.id ? (theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-200") : theme === "dark" ? "bg-[#1c1c1e] text-[#8e8e93] border-white/5" : "bg-white text-gray-500 border-black/5"}`}
                    style={{
                      borderColor:
                        limitForm.categoryId === cat.id ? cat.color : undefined,
                    }}
                  >
                    <span>{cat.icon}</span>
                    <span
                      className={`text-sm font-semibold ${limitForm.categoryId === cat.id ? "" : theme === "dark" ? "" : "text-gray-500"}`}
                    >
                      {cat.name}
                    </span>
                  </button>
                ))}
            </div>

            {/* Lưới 12 tháng */}
            <div className="grid grid-cols-4 gap-3 mb-8">
              {[
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
              ].map((mName, i) => {
                const mKey = `${limitYear}-${(i + 1).toString().padStart(2, "0")}`;
                const activeLimit =
                  monthlyCatLimits[mKey]?.[limitForm.categoryId] ??
                  catLimits[limitForm.categoryId];
                const isSelected = limitMonthKey === mKey;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setLimitMonthKey(mKey);
                      loadFormForCat(limitForm.categoryId, mKey, false);
                    }}
                    className={`p-3 rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${isSelected ? (theme === "dark" ? "border-[#32ade6] bg-[#32ade6]/10" : "border-[#32ade6] bg-[#32ade6]/10") : theme === "dark" ? "border-transparent bg-[#1c1c1e]" : "border-transparent bg-white shadow-sm"}`}
                  >
                    <span
                      className={`text-[13px] font-bold mb-1 ${isSelected ? "text-[#32ade6]" : theme === "dark" ? "text-[#8e8e93]" : "text-gray-500"}`}
                    >
                      {mName}
                    </span>
                    <span
                      className={`text-[11px] font-semibold ${activeLimit ? (theme === "dark" ? "text-white" : "text-black") : theme === "dark" ? "text-white/30" : "text-black/30"}`}
                    >
                      {activeLimit ? formatCompact(activeLimit) : "-"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Box Chỉnh sửa */}
            <div
              className={`rounded-3xl p-5 shadow-sm border mb-6 ${theme === "dark" ? "bg-[#1c1c1e] border-white/5" : "bg-white border-black/5"}`}
            >
              <div
                className={`flex rounded-xl p-1 mb-5 w-full ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-100"}`}
              >
                <button
                  onClick={() => setLimitScope("all")}
                  className={`flex-1 py-1.5 text-[12px] font-bold rounded-lg transition-colors duration-200 ${limitScope === "all" ? (theme === "dark" ? "bg-[#3a3a3c] text-white" : "bg-white text-black shadow-sm") : theme === "dark" ? "text-[#8e8e93]" : "text-gray-500"}`}
                >
                  All Time
                </button>
                <button
                  onClick={() => setLimitScope("month")}
                  className={`flex-1 py-1.5 text-[12px] font-bold rounded-lg transition-colors duration-200 ${limitScope === "month" ? (theme === "dark" ? "bg-[#3a3a3c] text-white" : "bg-white text-black shadow-sm") : theme === "dark" ? "text-[#8e8e93]" : "text-gray-500"}`}
                >
                  This Month
                </button>
                <button
                  onClick={() => setLimitScope("future")}
                  className={`flex-1 py-1.5 text-[12px] font-bold rounded-lg transition-colors duration-200 ${limitScope === "future" ? (theme === "dark" ? "bg-[#3a3a3c] text-white" : "bg-white text-black shadow-sm") : theme === "dark" ? "text-[#8e8e93]" : "text-gray-500"}`}
                >
                  This & Future
                </button>
              </div>
              <div className="relative w-full mb-2">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={
                    limitForm.amount === "0"
                      ? ""
                      : formatDisplayAmount(limitForm.amount)
                  }
                  onChange={(e) => {
                    setSaveLimitSuccess(false);
                    let val = e.target.value
                      .replace(/\./g, "")
                      .replace(/[^0-9,]/g, "");
                    if (val.split(",").length > 2) val = val.slice(0, -1);
                    if (val === "") val = "0";
                    setLimitForm({ ...limitForm, amount: val });
                  }}
                  className={`w-full rounded-2xl px-12 py-4 outline-none font-bold text-[24px] text-center ${theme === "dark" ? "bg-[#2c2c2e] text-white" : "bg-gray-100 text-black"}`}
                />
                {limitForm.amount !== "0" && (
                  <button
                    onClick={() => {
                      setSaveLimitSuccess(false);
                      setLimitForm({ ...limitForm, amount: "0" });
                    }}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full active:opacity-60 transition-opacity ${theme === "dark" ? "bg-[#3a3a3c] text-[#8e8e93]" : "bg-gray-300 text-gray-600"}`}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <div className="h-6 flex items-center justify-center mb-4">
                {saveLimitSuccess && (
                  <span className="text-[13px] font-medium text-[#8e8e93] animate-ios-fade">
                    Saved successfully
                  </span>
                )}
              </div>
              <button
                onClick={handleSaveLimit}
                className={`w-full py-4 rounded-2xl font-bold text-[17px] active:scale-[0.98] transition-transform ${theme === "dark" ? "bg-white text-black" : "bg-black text-white"}`}
              >
                Save Limit
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedCategory && (
        <div
          ref={detailContainerRef}
          className={`fixed inset-0 z-50 flex flex-col overflow-y-auto will-change-transform ${theme === "dark" ? "bg-black" : "bg-[#f2f2f7]"}`}
          style={{
            transition: showDetail
              ? "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)"
              : "none",
            transform: showDetail
              ? "translate3d(0, 0, 0)"
              : "translate3d(0, 100dvh, 0)",
          }}
        >
          <div
            className={`flex-shrink-0 z-40 pb-3 px-4 flex justify-between items-center shadow-[0_1px_0_0_rgba(0,0,0,0.05)] ${theme === "dark" ? "bg-black/90 shadow-[0_1px_0_0_rgba(255,255,255,0.05)]" : "bg-[#f2f2f7]/90"}`}
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
          >
            <button
              onClick={closeDetail}
              className="text-[#32ade6] flex items-center text-[17px] font-semibold active:opacity-50"
            >
              <ChevronLeft size={24} className="-ml-2" /> Back
            </button>
            <h2 className="font-bold text-[17px] text-center w-full absolute left-0 -z-10">
              {selectedCategory.name}
            </h2>
            <div className="w-20"></div>
          </div>
          <div className="flex-1 px-4 pt-6 pb-32">
            <div className="flex items-center gap-5 mb-8 px-2">
              <div
                className={`w-[72px] h-[72px] rounded-full flex items-center justify-center text-[36px] flex-shrink-0 ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white shadow-sm"}`}
              >
                {selectedCategory.icon}
              </div>
              <div>
                <div
                  className={`text-[36px] font-bold tracking-tight leading-none mb-2 ${theme === "dark" ? "text-white" : "text-black"}`}
                >
                  ₫{catTotal.toLocaleString("vi-VN")}
                </div>
                <div className="text-[13px] font-medium text-[#8e8e93]">
                  {catTransactions.length} entries • {bounds.label}
                </div>
              </div>
            </div>
            <div className="w-full">
              {sortedDetailGroups.map((group) => (
                <div key={group.date.toISOString()} className="mb-4 w-full">
                  <div className="flex justify-between items-center mb-2 px-1">
                    <span className="text-xs font-semibold text-[#8e8e93] uppercase tracking-wide">
                      {formatGroupHeader(group.date)}
                    </span>
                    <span className="text-xs font-semibold text-[#8e8e93]">
                      ₫{Math.abs(group.totalDay).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    {group.items.map((t) => (
                      <div
                        key={t.id}
                        className={`flex justify-between items-center py-4 border-b ${theme === "dark" ? "border-white/5" : "border-black/5"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor:
                                selectedCategory.color || "#32ade6",
                            }}
                          ></div>
                          <div className="flex flex-col">
                            <p
                              className={`font-bold text-[16px] leading-tight mb-1 ${theme === "dark" ? "text-white" : "text-black"}`}
                            >
                              {t.note || selectedCategory.name}
                            </p>
                            <p className="text-[13px] text-[#8e8e93] leading-tight font-medium">
                              {new Date(
                                t.date.replace(" ", "T"),
                              ).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`font-bold text-[16px] flex-shrink-0 ${theme === "dark" ? "text-white" : "text-black"}`}
                        >
                          ₫{t.amount.toLocaleString("vi-VN")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {sortedDetailGroups.length === 0 && (
                <p className="text-center text-[#8e8e93] mt-8 text-sm">
                  No transactions found.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
