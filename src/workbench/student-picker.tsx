import { useEffect, useRef, useState } from "react";
import { workbench } from "./client";
import type { StudentMatch } from "./types";

const SEARCH_DEBOUNCE_MS = 300;

/**
 * An existing student, by name (searched through the host) or by id. Both
 * controls show and set the same `studentId`.
 */
export const StudentPicker = ({
  studentId,
  onChange,
  idLabel = "o id del alumno",
}: {
  studentId: string;
  onChange: (studentId: string) => void;
  idLabel?: string;
}) => {
  const [search, setSearch] = useState("");
  const [matches, setMatches] = useState<StudentMatch[] | null>(null);
  /** The text the shown matches answer (blank = every student). */
  const [searched, setSearched] = useState("");
  const [error, setError] = useState<string | null>(null);
  const sequence = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const mine = ++sequence.current;
    const text = search.trim();
    const timer = setTimeout(async () => {
      const res = await workbench.get<StudentMatch[]>(
        `/students?search=${encodeURIComponent(text)}`,
      );
      if (mine !== sequence.current) return;
      setMatches(res.ok ? res.data : []);
      setSearched(text);
      setError(res.ok ? null : res.message);
      if (res.ok && res.data.length === 1 && text)
        onChangeRef.current(String(res.data[0].id));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const listed = matches?.some((match) => String(match.id) === studentId);

  return (
    <>
      <label>
        Buscar alumno por nombre
        <input
          type="search"
          value={search}
          placeholder="escribe un nombre"
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <label>
        Coincidencias
        <select
          value={listed ? studentId : ""}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">{matches === null ? "buscando…" : "elegir…"}</option>
          {matches?.map((match) => (
            <option key={match.id} value={match.id}>
              {match.fullName}
              {match.dni ? ` · ${match.dni}` : ""} (#{match.id})
            </option>
          ))}
        </select>
        {matches?.length === 0 && !error && (
          <span className="wb-hint">
            {searched
              ? "Ningún alumno coincide."
              : "No hay alumnos en el workspace."}
          </span>
        )}
        {error && <span className="wb-bad">{error}</span>}
      </label>
      <label>
        {idLabel}
        <input
          type="number"
          min={1}
          value={studentId}
          placeholder="id"
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    </>
  );
};
