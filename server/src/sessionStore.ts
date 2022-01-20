import { SessionData, Store } from 'express-session';
import { sessionRepository } from 'src/repository/session';

export class SessionStore extends Store {
    override async destroy(sid: string, callback: (error?: string) => void) {
        await sessionRepository.delete({ sid: sid });
        callback();
    }

    override async get(
        sid: string,
        callback: (error: string, session: SessionData) => void
    ) {
        const session = await sessionRepository.findOne({ sid: sid });

        if (session) {
            callback(null, JSON.parse(session.session));
        } else {
            callback(null, null);
        }
    }

    override async set(
        sid: string,
        session: SessionData,
        callback: (error?: unknown) => void
    ) {
        await sessionRepository.updateOrCreate({
            where: { sid: sid },
            value: {
                sid: sid,
                session: JSON.stringify(session),
            },
        });
        callback(null);
    }

    override async all(
        callback: (error: unknown, sessions: SessionData[]) => void
    ) {
        const sessions = await sessionRepository.find();

        callback(
            null,
            sessions.map((session) => JSON.parse(session.session))
        );
    }

    override async clear(callback: (error?: unknown) => void) {
        await sessionRepository.delete();

        callback(null);
    }

    override async length(callback: (error: unknown, len: number) => void) {
        const count = await sessionRepository.count();
        callback(null, count);
    }
}
