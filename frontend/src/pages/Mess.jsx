import { useState } from "react";
import { Pencil, Coffee, Sun, Moon, CalendarDays } from "lucide-react";
import Topbar from "../components/Topbar";
import { Card, SectionHeader } from "../components/ui";
import Modal, { Field, TextArea, FormActions } from "../components/Modal";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useAuth } from "../context/AuthContext";
import { messMenu as seedMessMenu } from "../data/mockData";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function todayName() {
  return DAYS[(new Date().getDay() + 6) % 7]; // getDay(): 0=Sun..6=Sat -> shift to Mon-first
}

export default function Mess() {
  const { user } = useAuth();
  const isStaff = user.role !== "student";
  const [menu, setMenu] = useLocalStorage("shms:messMenu", seedMessMenu);
  const [selectedDay, setSelectedDay] = useState(todayName());
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ breakfast: "", lunch: "", dinner: "" });

  const today = todayName();
  const meal = menu[selectedDay] || { breakfast: "", lunch: "", dinner: "" };

  const openEdit = () => {
    setForm(menu[selectedDay] || { breakfast: "", lunch: "", dinner: "" });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMenu((prev) => ({ ...prev, [selectedDay]: form }));
    setModalOpen(false);
  };

  return (
    <div>
      <Topbar title="Mess Menu" subtitle={isStaff ? "Manage the daily meal schedule" : "Today's meal schedule"} />
      <div className="p-8 space-y-5">
        <SectionHeader
          eyebrow={selectedDay === today ? "Today" : "Viewing"}
          title={selectedDay === today ? `${today}'s menu` : `${selectedDay}'s menu`}
          action={
            isStaff && (
              <button
                onClick={openEdit}
                className="flex items-center gap-1.5 bg-navy text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-navy-light transition-colors"
              >
                <Pencil size={14} /> Edit menu
              </button>
            )
          }
        />

        <Card className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-parchment rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Coffee size={16} className="text-navy" />
                <p className="text-xs font-semibold text-tag-dark uppercase tracking-wide">Breakfast</p>
              </div>
              <p className="text-sm text-ink">{meal.breakfast || "—"}</p>
            </div>
            <div className="bg-parchment rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sun size={16} className="text-navy" />
                <p className="text-xs font-semibold text-tag-dark uppercase tracking-wide">Lunch</p>
              </div>
              <p className="text-sm text-ink">{meal.lunch || "—"}</p>
            </div>
            <div className="bg-parchment rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Moon size={16} className="text-navy" />
                <p className="text-xs font-semibold text-tag-dark uppercase tracking-wide">Dinner</p>
              </div>
              <p className="text-sm text-ink">{meal.dinner || "—"}</p>
            </div>
          </div>
        </Card>

        {isStaff && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays size={16} className="text-navy" />
              <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Plan another day</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-md border transition-colors ${
                    selectedDay === d
                      ? "bg-navy text-white border-navy"
                      : "bg-white text-ink/60 border-line hover:border-navy/30"
                  }`}
                >
                  {d}{d === today ? " • Today" : ""}
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Edit ${selectedDay}'s menu`}>
        <form onSubmit={handleSubmit}>
          <Field label="Breakfast">
            <TextArea required value={form.breakfast} onChange={(e) => setForm({ ...form, breakfast: e.target.value })} />
          </Field>
          <Field label="Lunch">
            <TextArea required value={form.lunch} onChange={(e) => setForm({ ...form, lunch: e.target.value })} />
          </Field>
          <Field label="Dinner">
            <TextArea required value={form.dinner} onChange={(e) => setForm({ ...form, dinner: e.target.value })} />
          </Field>
          <FormActions onCancel={() => setModalOpen(false)} submitLabel="Save menu" />
        </form>
      </Modal>
    </div>
  );
}
