-- This file runs ONCE when Docker creates the database for the first time.
-- If you change it later, delete the Docker volume and start again
-- (see README: "Reset the database").

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Rooms
CREATE TABLE resources (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  iana_timezone TEXT NOT NULL
);

-- Weekly opening hours (local time in that room's timezone)
-- weekday: 0 = Sunday, 1 = Monday, ... 6 = Saturday
CREATE TABLE weekly_availability (
  id          SERIAL PRIMARY KEY,
  resource_id INT NOT NULL REFERENCES resources(id),
  weekday     INT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL
);

-- Bookings (empty until we add the booking API)
-- start_time / end_time are UTC instants
CREATE TABLE bookings (
  id          SERIAL PRIMARY KEY,
  resource_id INT NOT NULL REFERENCES resources(id),
  user_id     TEXT NOT NULL,
  start_time  TIMESTAMPTZ NOT NULL,
  end_time    TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Database stops two people booking the same overlapping time
  EXCLUDE USING gist (
    resource_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
  )
);

INSERT INTO resources (name, iana_timezone) VALUES
  ('Room A — London', 'Europe/London'),
  ('Room B — New York', 'America/New_York'),
  ('Room C — Mumbai', 'Asia/Kolkata');

INSERT INTO weekly_availability (resource_id, weekday, start_time, end_time) VALUES
  (1, 1, '09:00', '17:00'),
  (1, 2, '09:00', '17:00'),
  (1, 3, '09:00', '17:00'),
  (1, 4, '09:00', '17:00'),
  (1, 5, '09:00', '17:00'),
  (2, 1, '08:00', '16:00'),
  (2, 2, '08:00', '16:00'),
  (2, 3, '08:00', '16:00'),
  (2, 4, '08:00', '16:00'),
  (2, 5, '08:00', '16:00'),
  (3, 1, '10:00', '18:00'),
  (3, 2, '10:00', '18:00'),
  (3, 3, '10:00', '18:00'),
  (3, 4, '10:00', '18:00'),
  (3, 5, '10:00', '18:00'),
  (3, 6, '10:00', '18:00');
