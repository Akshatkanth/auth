import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import "./App.css";
import { ApiRequestError, apiRequest, type User, type ValidationErrors } from "./api";

type Mode = "login" | "register";
type NotesFilter = "active" | "archived" | "all";

interface AuthResponse {
  message?: string;
  accessToken: string;
  user: User;
}

interface NoteApiRecord {
  id?: string;
  _id?: string;
  title: string;
  content: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  owner?: string;
}

interface NoteRecord {
  id: string;
  title: string;
  content: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  owner?: string;
}

interface NotesResponse {
  count: number;
  notes: NoteApiRecord[];
}

interface NoteMutationResponse {
  message: string;
  note: NoteApiRecord;
}

interface AdminUserRecord {
  id: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
  updatedAt: string;
}

interface AdminUsersResponse {
  count: number;
  users: AdminUserRecord[];
}

const API_PREFIX = "/api/v1";
const API_VERSION_LABEL = "API v1";
const DEMO_ADMIN_CREDENTIALS = {
  email: import.meta.env.VITE_DEMO_ADMIN_EMAIL ?? "demo-admin@notes.app",
  password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD ?? "Admin@12345!"
};

const emptyDraft = {
  title: "",
  content: ""
};

const normalizeNote = (note: NoteApiRecord): NoteRecord => ({
  id: note.id ?? note._id ?? "",
  title: note.title,
  content: note.content,
  isArchived: note.isArchived,
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
  owner: note.owner
});

const buildNotesPath = (filter: NotesFilter): string => {
  if (filter === "all") {
    return `${API_PREFIX}/notes`;
  }

  return `${API_PREFIX}/notes?isArchived=${filter === "archived" ? "true" : "false"}`;
};

const formatDate = (value: string): string => {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};

function App() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState("Sign in to start managing notes.");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [notesStatus, setNotesStatus] = useState("Your workspace is ready.");
  const [filter, setFilter] = useState<NotesFilter>("active");
  const [draft, setDraft] = useState(emptyDraft);
  const [editorErrors, setEditorErrors] = useState<ValidationErrors>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [usersStatus, setUsersStatus] = useState("Admin tools ready.");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const authEndpoint = useMemo(
    () => (mode === "login" ? `${API_PREFIX}/auth/login` : `${API_PREFIX}/auth/register`),
    [mode]
  );

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) ?? null,
    [notes, selectedNoteId]
  );

  const archivedCount = notes.filter((note) => note.isArchived).length;
  const activeCount = notes.filter((note) => !note.isArchived).length;
  const isAdmin = user?.role === "admin";

  const resetComposer = (): void => {
    setDraft(emptyDraft);
    setEditingNoteId(null);
    setEditorErrors({});
  };

  const applyAuthSuccess = (data: AuthResponse): void => {
    setAccessToken(data.accessToken);
    setUser(data.user);
    setAuthStatus(data.message ?? "Authentication successful");
    setValidationErrors({});
    setPassword("");
  };

  const loadNotes = async (tokenOverride?: string): Promise<void> => {
    const token = tokenOverride ?? accessToken;
    if (!token) {
      return;
    }

    setNotesStatus("Loading notes...");

    try {
      const data = await apiRequest<NotesResponse>(buildNotesPath(filter), {
        token
      });

      const normalizedNotes = data.notes.map(normalizeNote);
      setNotes(normalizedNotes);

      if (!selectedNoteId && normalizedNotes.length > 0) {
        setSelectedNoteId(normalizedNotes[0].id);
      }

      if (selectedNoteId && !normalizedNotes.some((note) => note.id === selectedNoteId)) {
        setSelectedNoteId(normalizedNotes[0]?.id ?? null);
      }

      setNotesStatus(
        normalizedNotes.length > 0
          ? `${normalizedNotes.length} note${normalizedNotes.length === 1 ? "" : "s"} loaded`
          : "No notes yet. Create your first note."
      );
    } catch (error) {
      setNotes([]);
      setNotesStatus(error instanceof Error ? error.message : "Could not load notes");
    }
  };

  const loadUsers = async (tokenOverride?: string): Promise<void> => {
    const token = tokenOverride ?? accessToken;
    if (!token || !isAdmin) {
      setUsers([]);
      return;
    }

    setUsersStatus("Loading users...");

    try {
      const data = await apiRequest<AdminUsersResponse>(`${API_PREFIX}/auth/users`, {
        token
      });

      setUsers(data.users);
      setUsersStatus(
        data.users.length > 0
          ? `${data.users.length} user${data.users.length === 1 ? "" : "s"} loaded`
          : "No users found."
      );
    } catch (error) {
      setUsers([]);
      setUsersStatus(error instanceof Error ? error.message : "Could not load users");
    }
  };

  useEffect(() => {
    const initSession = async (): Promise<void> => {
      try {
        const data = await apiRequest<AuthResponse>(`${API_PREFIX}/auth/refresh`, { method: "POST" });
        applyAuthSuccess(data);
        setAuthStatus("Session restored");
      } catch {
        setAuthStatus("Sign in to start managing notes.");
      }
    };

    void initSession();
  }, []);

  useEffect(() => {
    if (!accessToken) {
      setNotes([]);
      setSelectedNoteId(null);
      return;
    }

    void loadNotes();
  }, [accessToken, filter]);

  useEffect(() => {
    if (!accessToken || !isAdmin) {
      setUsers([]);
      return;
    }

    void loadUsers();
  }, [accessToken, isAdmin]);

  const onSubmitAuth = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsAuthLoading(true);
    setValidationErrors({});

    try {
      const data = await apiRequest<AuthResponse>(authEndpoint, {
        method: "POST",
        body: { email, password }
      });

      applyAuthSuccess(data);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setValidationErrors(error.validationErrors ?? {});
        setAuthStatus(error.message);
      } else {
        setAuthStatus(error instanceof Error ? error.message : "Authentication failed");
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const onSubmitNote = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!accessToken) {
      setNotesStatus("Please sign in again.");
      return;
    }

    setIsSavingNote(true);
    setEditorErrors({});

    try {
      const payload = {
        title: draft.title,
        content: draft.content,
        ...(editingNoteId && selectedNote ? { isArchived: selectedNote.isArchived } : {})
      };

      const notesBasePath = `${API_PREFIX}/notes`;
      const path = editingNoteId ? `${notesBasePath}/${editingNoteId}` : notesBasePath;
      const method = editingNoteId ? "PATCH" : "POST";

      const data = await apiRequest<NoteMutationResponse>(path, {
        method,
        token: accessToken,
        body: payload
      });

      const savedNote = normalizeNote(data.note);
      setSelectedNoteId(savedNote.id);
      resetComposer();
      setNotesStatus(data.message);
      await loadNotes(accessToken);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setEditorErrors(error.validationErrors ?? {});
        setNotesStatus(error.message);
      } else {
        setNotesStatus(error instanceof Error ? error.message : "Could not save note");
      }
    } finally {
      setIsSavingNote(false);
    }
  };

  const beginEdit = (note: NoteRecord): void => {
    setSelectedNoteId(note.id);
    setEditingNoteId(note.id);
    setDraft({
      title: note.title,
      content: note.content
    });
    setEditorErrors({});
    setNotesStatus(`Editing "${note.title}"`);
  };

  const toggleArchive = async (note: NoteRecord): Promise<void> => {
    if (!accessToken) {
      return;
    }

    try {
      const data = await apiRequest<NoteMutationResponse>(`${API_PREFIX}/notes/${note.id}`, {
        method: "PATCH",
        token: accessToken,
        body: { isArchived: !note.isArchived }
      });

      setNotesStatus(data.message);
      await loadNotes(accessToken);
    } catch (error) {
      setNotesStatus(error instanceof Error ? error.message : "Could not update note");
    }
  };

  const removeNote = async (note: NoteRecord): Promise<void> => {
    if (!accessToken) {
      return;
    }

    const confirmed = window.confirm(`Delete "${note.title}"?`);
    if (!confirmed) {
      return;
    }

    try {
      const data = await apiRequest<{ message: string }>(`${API_PREFIX}/notes/${note.id}`, {
        method: "DELETE",
        token: accessToken
      });

      if (editingNoteId === note.id) {
        resetComposer();
      }

      if (selectedNoteId === note.id) {
        setSelectedNoteId(null);
      }

      setNotesStatus(data.message);
      await loadNotes(accessToken);
    } catch (error) {
      setNotesStatus(error instanceof Error ? error.message : "Could not delete note");
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiRequest<{ message: string }>(`${API_PREFIX}/auth/logout`, { method: "POST" });
    } finally {
      setAccessToken(null);
      setUser(null);
      setNotes([]);
      setUsers([]);
      setSelectedNoteId(null);
      resetComposer();
      setAuthStatus("Logged out");
      setNotesStatus("Your workspace is ready.");
    }
  };

  const updateManagedUserRole = async (
    managedUser: AdminUserRecord,
    role: "user" | "admin"
  ): Promise<void> => {
    if (!accessToken) {
      return;
    }

    setBusyUserId(managedUser.id);

    try {
      const data = await apiRequest<{ message: string; user: AdminUserRecord }>(
        `${API_PREFIX}/auth/users/${managedUser.id}/role`,
        {
          method: "PATCH",
          token: accessToken,
          body: { role }
        }
      );

      setUsersStatus(data.message);
      await loadUsers(accessToken);
    } catch (error) {
      setUsersStatus(error instanceof Error ? error.message : "Could not update user");
    } finally {
      setBusyUserId(null);
    }
  };

  const deleteManagedUser = async (managedUser: AdminUserRecord): Promise<void> => {
    if (!accessToken) {
      return;
    }

    const confirmed = window.confirm(`Delete user ${managedUser.email}?`);
    if (!confirmed) {
      return;
    }

    setBusyUserId(managedUser.id);

    try {
      const data = await apiRequest<{ message: string }>(`${API_PREFIX}/auth/users/${managedUser.id}`, {
        method: "DELETE",
        token: accessToken
      });

      setUsersStatus(data.message);
      await loadUsers(accessToken);
    } catch (error) {
      setUsersStatus(error instanceof Error ? error.message : "Could not delete user");
    } finally {
      setBusyUserId(null);
    }
  };

  if (!user || !accessToken) {
    return (
      <main className="auth-shell">
        <section className="hero-panel">
          <div className="eyebrow-row">
            <p className="eyebrow">Notes Workspace</p>
            <span className="version-pill">{API_VERSION_LABEL}</span>
          </div>
          <h1>Authenticate once, then manage notes like a real app.</h1>
          <p className="hero-copy">
            This project already has JWT auth, role-aware access, MongoDB, API versioning, and notes
            CRUD. The frontend now matches that purpose: sign up, log in, and start writing.
          </p>
          <div className="api-paths">
            <span>/api/v1/auth</span>
            <span>/api/v1/notes</span>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <h2>Secure Auth</h2>
              <p>Password hashing, JWT access tokens, refresh cookies, and validation-backed forms.</p>
            </article>
            <article className="feature-card">
              <h2>Notes CRUD</h2>
              <p>Create, update, archive, and delete notes once you enter the workspace.</p>
            </article>
            <article className="feature-card">
              <h2>Ready Backend</h2>
              <p>Role-aware APIs, MongoDB models, Postman docs, and versioned routes are already wired.</p>
            </article>
          </div>
        </section>

        <section className="auth-card">
          <div className="mode-switch" role="tablist" aria-label="Auth mode">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => {
                setMode("login");
                setValidationErrors({});
              }}
              type="button"
            >
              Login
            </button>
            <button
              className={mode === "register" ? "active" : ""}
              onClick={() => {
                setMode("register");
                setValidationErrors({});
              }}
              type="button"
            >
              Sign up
            </button>
          </div>

          <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p className="panel-copy">
            {mode === "login"
              ? "Use your account to enter the notes workspace."
              : "Create an account and you will land directly in your notes dashboard."}
          </p>

          <form onSubmit={onSubmitAuth} className="auth-form">
            <label>
              Email
              <input
                autoComplete="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
            {validationErrors.email?.length ? <p className="field-error">{validationErrors.email[0]}</p> : null}

            <label>
              Password
              <input
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === "login" ? "Your password" : "Aa!12345"}
                required
                minLength={mode === "register" ? 8 : 1}
              />
            </label>
            {validationErrors.password?.length ? (
              <p className="field-error">{validationErrors.password[0]}</p>
            ) : null}

            {mode === "register" ? (
              <p className="helper-text">
                Passwords need 8+ characters with uppercase, lowercase, number, and special character.
              </p>
            ) : null}

            <button disabled={isAuthLoading} className="primary-button" type="submit">
              {isAuthLoading ? "Working..." : mode === "login" ? "Enter workspace" : "Create account"}
            </button>
          </form>

          <div className="demo-card">
            <div className="demo-header">
              <div>
                <p className="demo-label">Demo Admin Login</p>
                <p className="helper-text">For admin role-based access testing.</p>
              </div>
              <button
                className="ghost-button"
                onClick={() => {
                  setMode("login");
                  setEmail(DEMO_ADMIN_CREDENTIALS.email);
                  setPassword(DEMO_ADMIN_CREDENTIALS.password);
                  setValidationErrors({});
                  setAuthStatus("Demo admin credentials loaded.");
                }}
                type="button"
              >
                Use demo admin
              </button>
            </div>
            <div className="demo-credentials">
              <span>Email: {DEMO_ADMIN_CREDENTIALS.email}</span>
              <span>Password: {DEMO_ADMIN_CREDENTIALS.password}</span>
            </div>
          </div>

          <p className="status-line">{authStatus}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <div>
          <div className="eyebrow-row">
            <p className="eyebrow">Authenticated Workspace</p>
            <span className="version-pill">{API_VERSION_LABEL}</span>
          </div>
          <h1>Notes dashboard</h1>
          <p className="panel-copy">
            Create, update, archive, and delete notes. Your profile stays visible in the sidebar.
          </p>
          <div className="api-paths">
            <span>/api/v1/auth</span>
            <span>/api/v1/notes</span>
          </div>
        </div>

        <div className="header-actions">
          <button className="ghost-button" onClick={() => void loadNotes()} type="button">
            Refresh notes
          </button>
          <button className="danger-button" onClick={logout} type="button">
            Logout
          </button>
        </div>
      </header>

      <section className="stats-row">
        <article className="stat-card">
          <span>Total visible</span>
          <strong>{notes.length}</strong>
        </article>
        <article className="stat-card">
          <span>Active</span>
          <strong>{activeCount}</strong>
        </article>
        <article className="stat-card">
          <span>Archived</span>
          <strong>{archivedCount}</strong>
        </article>
      </section>

      <section className="workspace-grid">
        <div className="main-column">
          <section className="panel composer-panel">
            <div className="section-heading">
              <div>
                <h2>{editingNoteId ? "Edit note" : "New note"}</h2>
                <p>{editingNoteId ? "Update the selected note." : "Draft something useful for your workspace."}</p>
              </div>
              {editingNoteId ? (
                <button className="ghost-button" onClick={resetComposer} type="button">
                  Cancel edit
                </button>
              ) : null}
            </div>

            <form className="composer-form" onSubmit={onSubmitNote}>
              <label>
                Title
                <input
                  type="text"
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      title: event.target.value
                    }))
                  }
                  placeholder="Plan next sprint"
                  maxLength={150}
                  required
                />
              </label>
              {editorErrors.title?.length ? <p className="field-error">{editorErrors.title[0]}</p> : null}

              <label>
                Content
                <textarea
                  value={draft.content}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      content: event.target.value
                    }))
                  }
                  placeholder="Write your note here..."
                  maxLength={5000}
                  rows={8}
                  required
                />
              </label>
              {editorErrors.content?.length ? <p className="field-error">{editorErrors.content[0]}</p> : null}

              <div className="composer-actions">
                <button className="primary-button" disabled={isSavingNote} type="submit">
                  {isSavingNote ? "Saving..." : editingNoteId ? "Update note" : "Create note"}
                </button>
                <p className="status-line compact">{notesStatus}</p>
              </div>
            </form>
          </section>

          <section className="panel notes-panel">
            <div className="section-heading">
              <div>
                <h2>Your notes</h2>
                <p>Switch between active, archived, or all notes.</p>
              </div>

              <div className="filter-group" role="tablist" aria-label="Notes filters">
                {(["active", "archived", "all"] as NotesFilter[]).map((option) => (
                  <button
                    key={option}
                    className={filter === option ? "active" : ""}
                    onClick={() => setFilter(option)}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="notes-list">
              {notes.length === 0 ? (
                <article className="empty-state">
                  <h3>No notes yet</h3>
                  <p>Create a note from the composer and it will appear here.</p>
                </article>
              ) : (
                notes.map((note) => (
                  <article
                    key={note.id}
                    className={`note-card ${selectedNoteId === note.id ? "selected" : ""}`}
                  >
                    <button
                      className="note-preview"
                      onClick={() => setSelectedNoteId(note.id)}
                      type="button"
                    >
                      <div className="note-meta">
                        <span>{note.isArchived ? "Archived" : "Active"}</span>
                        <span>Updated {formatDate(note.updatedAt)}</span>
                      </div>
                      <h3>{note.title}</h3>
                      <p>{note.content}</p>
                    </button>

                    <div className="note-actions">
                      <button className="ghost-button" onClick={() => beginEdit(note)} type="button">
                        Edit
                      </button>
                      <button className="ghost-button" onClick={() => void toggleArchive(note)} type="button">
                        {note.isArchived ? "Restore" : "Archive"}
                      </button>
                      <button className="danger-button" onClick={() => void removeNote(note)} type="button">
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="sidebar-column">
          <section className="panel profile-panel">
            <h2>Profile</h2>
            <div className="profile-grid">
              <div>
                <span className="profile-label">Email</span>
                <strong>{user.email}</strong>
              </div>
              <div>
                <span className="profile-label">Role</span>
                <strong className={user.role === "admin" ? "role-pill admin" : "role-pill"}>{user.role}</strong>
              </div>
              <div>
                <span className="profile-label">User ID</span>
                <strong className="mono-text">{user.id}</strong>
              </div>
            </div>
          </section>

          <section className="panel detail-panel">
            <h2>Selected note</h2>
            {selectedNote ? (
              <>
                <p className="detail-date">Created {formatDate(selectedNote.createdAt)}</p>
                <h3>{selectedNote.title}</h3>
                <p className="detail-copy">{selectedNote.content}</p>
                <div className="detail-flags">
                  <span>{selectedNote.isArchived ? "Archived note" : "Active note"}</span>
                  {user.role === "admin" && selectedNote.owner ? (
                    <span className="mono-text">Owner {selectedNote.owner}</span>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="detail-copy">Select a note to preview it here.</p>
            )}
          </section>

          {isAdmin ? (
            <section className="panel admin-panel">
              <div className="section-heading">
                <div>
                  <h2>Admin users</h2>
                  <p>Manage user roles and remove accounts for the demo.</p>
                </div>
                <button className="ghost-button" onClick={() => void loadUsers()} type="button">
                  Refresh users
                </button>
              </div>

              <p className="status-line compact">{usersStatus}</p>

              <div className="users-list">
                {users.map((managedUser) => {
                  const isCurrentUser = managedUser.id === user.id;
                  const isBusy = busyUserId === managedUser.id;
                  const nextRole = managedUser.role === "admin" ? "user" : "admin";

                  return (
                    <article key={managedUser.id} className="user-card">
                      <div className="user-summary">
                        <strong>{managedUser.email}</strong>
                        <span className={managedUser.role === "admin" ? "role-pill admin" : "role-pill"}>
                          {managedUser.role}
                        </span>
                      </div>
                      <p className="user-meta">Joined {formatDate(managedUser.createdAt)}</p>
                      {isCurrentUser ? <p className="user-meta">Current demo admin account</p> : null}
                      <div className="user-actions">
                        <button
                          className="ghost-button"
                          disabled={isCurrentUser || isBusy}
                          onClick={() => void updateManagedUserRole(managedUser, nextRole)}
                          type="button"
                        >
                          {isBusy ? "Working..." : `Make ${nextRole}`}
                        </button>
                        <button
                          className="danger-button"
                          disabled={isCurrentUser || isBusy}
                          onClick={() => void deleteManagedUser(managedUser)}
                          type="button"
                        >
                          Delete user
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}
        </aside>
      </section>
    </main>
  );
}

export default App;
