import type { StaffSession, Event, Organizer } from '@prisma/client';

export type ActiveStaffSession = StaffSession & {
    event: Pick<Event, 'id' | 'title' | 'startDate' | 'venue'>;
    organizer: Pick<Organizer, 'id' | 'businessName'>;
};
