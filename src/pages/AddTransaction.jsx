import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, Delete, Calendar, Repeat, Clock, Timer } from "lucide-react";
import { useAppContext } from "../AppContext";

export default function AddTransaction() {
  const navigate = useNavigate();
  const { categories, theme, workHourlyRate } = useAppContext();

  const [amount, setAmount] = useState("0");
  const [type, setType] = useState("expense");
  const [note, setNote] = useState("");
  const [repeat, setRepeat] = useState("none");

  // Trạng thái hiệu ứng Save
  const [saveState, setSaveState] = useState(0);
  const [rect, setRect] = useState(null);

  const [pastNotes, setPastNotes] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const containerRef = useRef(null);
  const categoryListRef = useRef(null);
  const buttonRef = useRef(null);

  const getCurrentDate = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now - tzOffset).toISOString().slice(0, 10);
  };

  const getCurrentTime = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now - tzOffset).toISOString().slice(11, 16);
  };

  const [datePart, setDatePart] = useState(getCurrentDate());
  const [timePart, setTimePart] = useState(getCurrentTime());

  const safeCategories = categories.map((c) => ({
    ...c,
    type: c.type || "expense",
  }));
  const currentCategories = safeCategories.filter((c) => c.type === type);
  const [category, setCategory] = useState(currentCategories[0] || {});

  useEffect(() => {
    const txs = JSON.parse(localStorage.getItem("vys_transactions") || "[]");
    const noteFreq = new Map();
    const now = new Date();

    txs.forEach((t) => {
      const txDate = new Date(t.date);
      if (txDate > now) return;

      if (
        t.note &&
        t.note.trim() !== "" &&
        t.note !== "Expense" &&
        t.note !== "Income" &&
        t.category
      ) {
        const key = t.note.toLowerCase().trim();
        if (!noteFreq.has(key)) {
          noteFreq.set(key, {
            note: t.note,
            category: t.category,
            type: t.type,
            count: 1,
          });
        } else {
          noteFreq.get(key).count += 1;
        }
      }
    });

    const sortedNotes = Array.from(noteFreq.values()).sort(
      (a, b) => b.count - a.count,
    );
    setPastNotes(sortedNotes);
  }, []);

  useEffect(() => {
    if (!note.trim()) {
      setSuggestions(pastNotes.slice(0, 2));
    }
  }, [note, pastNotes]);

  const handleNoteChange = (e) => {
    const val = e.target.value;
    setNote(val);

    if (val.trim()) {
      const matches = pastNotes.filter(
        (n) =>
          n.note.toLowerCase().includes(val.toLowerCase()) &&
          n.note.toLowerCase() !== val.toLowerCase(),
      );
      setSuggestions(matches.slice(0, 2));
    } else {
      setSuggestions(pastNotes.slice(0, 2));
    }
  };

  const acceptSuggestion = (sObj) => {
    setNote(sObj.note);
    if (sObj.type) setType(sObj.type);
    if (sObj.category) setCategory(sObj.category);
    setSuggestions(pastNotes.slice(0, 2));
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0,
      startX = 0,
      currentY = 0;
    let isDragging = false,
      isClosing = false,
      dragDirection = null;
    let rafId = null;

    const handleTouchStart = (e) => {
      if (container.scrollTop > 0) return;
      if (isClosing) return;

      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isDragging = true;
      dragDirection = null;

      container.style.transition = "none";
      container.style.animation = "none";
    };

    const handleTouchMove = (e) => {
      if (!isDragging || isClosing) return;

      const diffX = e.touches[0].clientX - startX;
      const diffY = e.touches[0].clientY - startY;

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
        setTimeout(() => navigate("/"), 300);
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
  }, [navigate]);

  const handleCloseButton = () => {
    if (containerRef.current) {
      containerRef.current.style.transition =
        "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)";
      containerRef.current.style.transform = `translate3d(0, 100dvh, 0)`;
    }
    setTimeout(() => navigate("/"), 300);
  };

  useEffect(() => {
    if (categoryListRef.current) {
      categoryListRef.current.scrollLeft = 0;
    }
    setCategory(currentCategories[0] || {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, categories]);

  const handleKeyPress = (val) => {
    if (val === "000") {
      if (amount === "0") return;
      if (amount.length <= 9) setAmount(amount + val);
    } else if (val === ",") {
      if (!amount.includes(",")) setAmount(amount + ",");
    } else {
      if (amount === "0") setAmount(val);
      else if (amount.length < 12) setAmount(amount + val);
    }
  };

  const handleDelete = () => {
    if (amount.length <= 1) setAmount("0");
    else setAmount(amount.slice(0, -1));
  };

  const performSave = () => {
    try {
      const numericAmount = Number(amount.replace(",", "."));
      const baseDate = new Date(`${datePart}T${timePart}`);

      let count = 1;
      if (repeat === "daily") count = 365;
      if (repeat === "weekly") count = 104;
      if (repeat === "monthly") count = 60;
      if (repeat === "yearly") count = 10;

      const newTransactions = [];
      const groupId = "rep_" + Date.now();
      const existingData = JSON.parse(
        localStorage.getItem("vys_transactions") || "[]",
      );

      for (let i = 0; i < count; i++) {
        const d = new Date(baseDate);
        if (repeat === "daily") d.setDate(d.getDate() + i);
        if (repeat === "weekly") d.setDate(d.getDate() + i * 7);
        if (repeat === "monthly") d.setMonth(d.getMonth() + i);
        if (repeat === "yearly") d.setFullYear(d.getFullYear() + i);

        newTransactions.push({
          id: Date.now().toString() + "_" + i,
          amount: numericAmount,
          type: type,
          note:
            note ||
            category.name ||
            (type === "expense" ? "Expense" : "Income"),
          category: category,
          date: d.toISOString(),
          recurringId: repeat !== "none" ? groupId : null,
          repeatMode: repeat !== "none" ? repeat : null,
        });
      }

      const updated = [...newTransactions, ...existingData];
      localStorage.setItem("vys_transactions", JSON.stringify(updated));
      navigate("/");
    } catch (e) {
      console.error(e);
      setSaveState(0);
    }
  };

  const handleSave = () => {
    if (amount === "0" || amount === ",") return;

    // 1. Chốt tọa độ nút bấm hiện tại để tạo hiệu ứng không bị giật
    const btnRect = buttonRef.current.getBoundingClientRect();
    setRect({
      top: btnRect.top,
      left: btnRect.left,
      width: btnRect.width,
      height: btnRect.height,
    });

    setSaveState(1);

    // 2. Chuyển sang hiệu ứng bay ra giữa và xoay sau 1 frame
    setTimeout(() => {
      setSaveState(2);

      // 3. Chờ hiệu ứng bay xong, bắt đầu thu nhỏ biến mất
      setTimeout(() => {
        setSaveState(3);

        // 4. Khi nút đã tàng hình, kích hoạt animation đóng trang trượt xuống
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.style.transition =
              "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)";
            containerRef.current.style.transform = `translate3d(0, 100dvh, 0)`;
          }

          // 5. Kết thúc animation, lưu data và navigate về trang chủ
          setTimeout(() => {
            performSave();
          }, 400);
        }, 300);
      }, 800);
    }, 20);
  };

  const displayAmount = () => {
    if (amount === "0") return "0";
    const parts = amount.split(",");
    return parts.length > 1
      ? `${parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${parts[1]}`
      : parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const calculatedHours = () => {
    if (workHourlyRate <= 0 || amount === "0" || amount === ",") return null;
    const numericAmount = Number(amount.replace(",", "."));
    const hours = (numericAmount / workHourlyRate).toFixed(1);
    return hours > 0 ? hours : null;
  };

  let dynamicStyle = {};
  if (saveState >= 1 && rect) {
    dynamicStyle = {
      position: "fixed",
      zIndex: 100,
      top: saveState === 1 ? `${rect.top}px` : "50%",
      left: saveState === 1 ? `${rect.left}px` : "50%",
      width: saveState === 1 ? `${rect.width}px` : "72px",
      height: saveState === 1 ? `${rect.height}px` : "72px",
      transform:
        saveState === 1
          ? "none"
          : saveState === 2
            ? "translate(-50%, -50%) rotate(360deg)"
            : "translate(-50%, -50%) rotate(360deg) scale(0)",
      opacity: saveState === 3 ? 0 : 1,
      backgroundColor:
        saveState === 1
          ? theme === "dark"
            ? "#ffffff"
            : "#000000"
          : "#32d74b",
      color:
        saveState === 1
          ? theme === "dark"
            ? "#000000"
            : "#ffffff"
          : "#ffffff",
      borderRadius: saveState === 1 ? "9999px" : "50%",
      transition:
        saveState === 1
          ? "none"
          : saveState === 2
            ? "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)"
            : "all 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
    };
  }

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-[100dvh] p-5 overflow-y-auto scrollbar-hide animate-ios-slide will-change-transform ${theme === "dark" ? "bg-black text-white" : "bg-[#f2f2f7] text-black"}`}
      style={{
        paddingTop: "max(env(safe-area-inset-top), 20px)",
        paddingBottom: "max(env(safe-area-inset-bottom), 20px)",
      }}
    >
      <div className="w-full flex justify-center py-2 mb-2 pointer-events-none flex-shrink-0">
        <div
          className={`w-14 h-1.5 rounded-full ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-300"}`}
        ></div>
      </div>

      <div className="flex justify-between items-center mb-5 flex-shrink-0">
        <button
          onClick={handleCloseButton}
          className={`p-1 active:opacity-50 flex-shrink-0 w-[42px] ${theme === "dark" ? "text-[#8e8e93]" : "text-gray-500"}`}
        >
          <X size={26} />
        </button>
        <div
          className={`relative flex rounded-full p-1 w-[200px] ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-gray-200"}`}
        >
          <div
            className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full transition-all duration-300 ease-out ${type === "expense" ? "translate-x-0 bg-[#ff453a]" : "translate-x-[100%] bg-[#32d74b]"}`}
          ></div>
          <button
            onClick={() => setType("expense")}
            className={`relative z-10 flex-1 py-1.5 text-sm font-semibold transition-colors duration-300 ${type === "expense" ? "text-white" : "text-[#8e8e93]"}`}
          >
            Expense
          </button>
          <button
            onClick={() => setType("income")}
            className={`relative z-10 flex-1 py-1.5 text-sm font-semibold transition-colors duration-300 ${type === "income" ? "text-white" : "text-[#8e8e93]"}`}
          >
            Income
          </button>
        </div>
        <div className="w-[42px] flex-shrink-0"></div>
      </div>

      <div
        ref={categoryListRef}
        className="flex overflow-x-auto flex-nowrap gap-2.5 py-1 mb-3 scrollbar-hide items-center min-h-[50px] flex-shrink-0"
      >
        {currentCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={(e) => {
              e.stopPropagation();
              setCategory(cat);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all flex-shrink-0 ${category.id === cat.id ? (theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-200") : theme === "dark" ? "bg-[#1c1c1e] text-[#8e8e93]" : "bg-white text-gray-500"}`}
            style={{
              border:
                category.id === cat.id
                  ? `1.5px solid ${cat.color}`
                  : "1.5px solid transparent",
            }}
          >
            <span className="text-base pointer-events-none">{cat.icon}</span>
            <span
              className={`text-sm font-semibold pointer-events-none ${category.id === cat.id ? (theme === "dark" ? "text-white" : "text-black") : theme === "dark" ? "text-[#8e8e93]" : "text-gray-500"}`}
            >
              {cat.name}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center min-h-[160px] relative flex-shrink-0">
        <span
          className={`text-xs uppercase tracking-wider mb-1 font-medium ${theme === "dark" ? "text-[#8e8e93]" : "text-gray-500"}`}
        >
          Amount
        </span>
        <div className="text-[56px] font-bold tracking-tight flex items-baseline">
          <span
            className={`text-4xl mr-1 ${theme === "dark" ? "text-[#8e8e93]" : "text-gray-500"}`}
          >
            ₫
          </span>
          <span>{displayAmount()}</span>
        </div>

        <div className="h-5 flex items-center justify-center mb-1">
          {calculatedHours() && (
            <span
              className={`text-[12px] font-medium flex items-center gap-1.5 animate-ios-fade ${type === "expense" ? "text-[#ff453a]/80" : "text-[#32d74b]/80"}`}
            >
              <Timer size={13} />
              {type === "expense" ? "Costs" : "Equals"} {calculatedHours()}{" "}
              {calculatedHours() === "1.0" ? "hour" : "hours"} of work
            </span>
          )}
        </div>

        <div className="relative w-full flex flex-col items-center">
          <input
            type="text"
            placeholder="+ Add note..."
            value={note}
            onChange={handleNoteChange}
            onTouchStart={(e) => e.stopPropagation()}
            className={`bg-transparent text-center focus:outline-none w-3/4 py-1 ${theme === "dark" ? "text-[#8e8e93] placeholder:text-[#8e8e93]/50" : "text-gray-600 placeholder:text-gray-400"}`}
          />

          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 flex overflow-x-auto scrollbar-hide px-5 py-1 z-50">
              <div className="flex gap-2.5 mx-auto w-max">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      acceptSuggestion(s);
                    }}
                    className={`px-3.5 py-2 rounded-full text-[13px] font-medium shadow-sm active:scale-95 transition-transform flex items-center gap-1.5 flex-shrink-0 ${theme === "dark" ? "bg-[#2c2c2e] text-white" : "bg-white text-black border border-gray-200"}`}
                  >
                    <span>{s.category?.icon}</span>
                    <span>{s.note}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-4 mt-auto flex-shrink-0 pt-4">
        <div
          className={`flex-[1.2] relative rounded-xl flex items-center justify-center py-2.5 overflow-hidden active:opacity-60 transition-opacity ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
        >
          <span
            className={`font-semibold text-[12px] flex items-center gap-1.5 pointer-events-none ${theme === "dark" ? "text-white" : "text-black"}`}
          >
            <Calendar size={14} className="text-[#32ade6]" />
            {new Date(datePart).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
          <input
            type="date"
            value={datePart}
            onChange={(e) => setDatePart(e.target.value)}
            onTouchStart={(e) => e.stopPropagation()}
            className="absolute inset-0 opacity-0 z-20 w-full h-full"
          />
        </div>
        <div
          className={`flex-1 relative rounded-xl flex items-center justify-center py-2.5 overflow-hidden active:opacity-60 transition-opacity ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
        >
          <span
            className={`font-semibold text-[12px] flex items-center gap-1.5 pointer-events-none ${theme === "dark" ? "text-white" : "text-black"}`}
          >
            <Clock size={14} className="text-[#32ade6]" />
            {timePart}
          </span>
          <input
            type="time"
            value={timePart}
            onChange={(e) => setTimePart(e.target.value)}
            onTouchStart={(e) => e.stopPropagation()}
            className="absolute inset-0 opacity-0 z-20 w-full h-full"
          />
        </div>
        <div
          className={`flex-1 relative rounded-xl flex items-center justify-center py-2.5 overflow-hidden active:opacity-60 transition-opacity ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
        >
          <span
            className={`font-semibold text-[12px] flex items-center gap-1.5 pointer-events-none capitalize ${theme === "dark" ? "text-white" : "text-black"}`}
          >
            <Repeat size={14} className="text-[#32ade6]" />
            {repeat === "none" ? "None" : repeat}
          </span>
          <select
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
            onTouchStart={(e) => e.stopPropagation()}
            className="absolute inset-0 opacity-0 z-20 w-full h-full"
          >
            <option value="none">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 flex-shrink-0">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={(e) => {
              e.stopPropagation();
              handleKeyPress(num.toString());
            }}
            className={`py-3 rounded-2xl text-2xl font-semibold active:opacity-60 ${theme === "dark" ? "bg-[#1c1c1e] text-white" : "bg-white text-black shadow-sm"}`}
          >
            {num}
          </button>
        ))}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleKeyPress("000");
          }}
          className={`py-3 rounded-2xl text-2xl font-semibold active:opacity-60 ${theme === "dark" ? "bg-[#1c1c1e] text-white" : "bg-white text-black shadow-sm"}`}
        >
          000
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleKeyPress("0");
          }}
          className={`py-3 rounded-2xl text-2xl font-semibold active:opacity-60 ${theme === "dark" ? "bg-[#1c1c1e] text-white" : "bg-white text-black shadow-sm"}`}
        >
          0
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          className={`py-3 rounded-2xl flex items-center justify-center active:opacity-60 ${theme === "dark" ? "bg-[#1c1c1e] text-[#8e8e93]" : "bg-white text-gray-500 shadow-sm"}`}
        >
          <Delete size={26} />
        </button>
      </div>

      {/* Dùng một div chêm vào để layout không bị giật khi nút Save tách ra làm position fixed */}
      {saveState >= 1 && (
        <div
          style={{ width: rect?.width, height: rect?.height }}
          className="flex-shrink-0"
        />
      )}

      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          if (saveState === 0) handleSave();
        }}
        style={saveState >= 1 ? dynamicStyle : undefined}
        className={
          saveState === 0
            ? `w-full py-3.5 rounded-full font-bold text-[17px] relative overflow-hidden flex-shrink-0 transition-transform active:scale-[0.98] ${theme === "dark" ? "bg-white text-black" : "bg-black text-white"}`
            : `flex items-center justify-center overflow-hidden`
        }
      >
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${saveState === 0 ? "opacity-100" : "opacity-0"}`}
        >
          Save
        </div>

        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 delay-100 ${saveState >= 2 ? "opacity-100" : "opacity-0"}`}
        >
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </button>
    </div>
  );
}
