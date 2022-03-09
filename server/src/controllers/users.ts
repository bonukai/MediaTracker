import _ from 'lodash';

import { User, userNonSensitiveColumns } from 'src/entity/user';
import { userRepository } from 'src/repository/user';
import {
  Notifications,
  NotificationPlatformsCredentialsType,
  NotificationPlatformsResponseType,
} from 'src/notifications/notifications';
import { createExpressRoute } from 'typescript-routes-to-openapi-server';
import { localAuthentication } from 'src/auth';
import { notificationPlatformsCredentialsRepository } from 'src/repository/notificationPlatformsCredentials';
import { configurationRepository } from 'src/repository/globalSettings';
import { RequestError, toRequestErrorObject } from 'src/requestError';
import { Config } from 'src/config';
import { t } from '@lingui/macro';

type UserResponse = Omit<User, 'password'>;

/**
 * @openapi_tags User
 */
export class UsersController {
  /**
   * @openapi_operationId get
   */
  get = createExpressRoute<{
    path: '/api/user';
    method: 'get';
    responseBody: undefined | UserResponse;
  }>(async (req, res) => {
    if (typeof req.user === 'number') {
      const user = await userRepository.findOne({ id: req.user });
      res.send(user);
    } else {
      res.send(null);
    }
  });

  /**
   * @openapi_operationId logout
   */
  logout = createExpressRoute<{
    path: '/api/user/logout';
    method: 'get';
  }>(async (req, res) => {
    req.logout();
    res.redirect('/');
  });

  /**
   * @openapi_operationId login
   */
  login = createExpressRoute<{
    path: '/api/user/login';
    method: 'post';
    requestBody: {
      username: string;
      password: string;
    };
  }>(localAuthentication, async (req, res) => {
    const user = await userRepository.findOne({ id: Number(req.user) });
    res.send(user);
  });

  /**
   * @openapi_operationId register
   */
  register = createExpressRoute<{
    path: '/api/user/register';
    method: 'post';
    requestBody: {
      username: string;
      password: string;
      confirmPassword: string;
    };
    responseBody: UserResponse | RequestError;
  }>(
    async (req, res, next) => {
      if (Config.DEMO) {
        res.sendStatus(401);
        return;
      }

      const configuration = await configurationRepository.findOne();
      const usersCount = await userRepository.count();

      if (usersCount > 0 && !configuration.enableRegistration) {
        res.sendStatus(401);
        return;
      }

      const { username, password, confirmPassword } = req.body;
      const user = await userRepository.findOne({ name: username });

      if (user) {
        res.send(toRequestErrorObject(t`User already exists`));
        return;
      }

      if (password !== confirmPassword) {
        res.send(toRequestErrorObject(t`Passwords do not match`));
        return;
      }

      if (password.trim().length === 0) {
        res.send(toRequestErrorObject(t`Password cannot be empty`));
        return;
      }

      if (username.trim().length === 0) {
        res.send(toRequestErrorObject(t`Username cannot be empty`));
        return;
      }

      await userRepository.create({
        name: username,
        password: password,
        admin: usersCount === 0,
      });

      next();
    },
    localAuthentication,
    async (req, res) => {
      const user = await userRepository.findOne({ id: Number(req.user) });
      res.send(user);
    }
  );

  /**
   * @openapi_operationId getNotificationCredentials
   */
  getNotificationCredentials = createExpressRoute<{
    path: '/api/user/notification-credentials';
    method: 'get';
    responseBody: {
      [N in keyof NotificationPlatformsCredentialsType]?: NotificationPlatformsCredentialsType[N];
    };
  }>(async (req, res) => {
    const userId = Number(req.user);

    const credentials = await notificationPlatformsCredentialsRepository.get(
      userId
    );

    res.send(credentials);
  });

  /**
   * @openapi_operationId updateNotificationCredentials
   */
  updateNotificationCredentials = createExpressRoute<{
    path: '/api/user/notification-credentials';
    method: 'put';
    requestBody: NotificationPlatformsResponseType;
  }>(async (req, res) => {
    const userId = Number(req.user);

    const { platformName, credentials } = req.body;

    try {
      await Notifications.sendNotification(platformName, {
        title: 'MediaTracker',
        message: t`Test message`,
        credentials: credentials,
      });
    } catch (error) {
      res.status(400);
      res.send(error.toString());
      return;
    }

    await notificationPlatformsCredentialsRepository.delete({
      platformName: platformName,
      userId: userId,
    });

    await notificationPlatformsCredentialsRepository.createMany(
      Object.entries(credentials).map(([key, value]) => ({
        platformName: platformName,
        name: key,
        value: value.toString(),
        userId: userId,
      }))
    );

    res.sendStatus(200);
  });

  /**
   * @openapi_operationId update
   */
  update = createExpressRoute<{
    path: '/api/user/settings';
    method: 'put';
    requestBody: Partial<
      Pick<
        User,
        Exclude<typeof userNonSensitiveColumns[number], 'id' | 'admin'>
      >
    >;
  }>(async (req, res) => {
    const userId = Number(req.user);
    const newUserSettings = _.pick(req.body, userNonSensitiveColumns);

    await userRepository.update({
      id: userId,
      ...newUserSettings,
    });

    res.sendStatus(200);
  });

  /**
   * @openapi_operationId updatePassword
   */
  updatePassword = createExpressRoute<{
    path: '/api/user/password';
    method: 'put';
    requestBody: {
      currentPassword: string;
      newPassword: string;
    };
  }>(async (req, res) => {
    if (Config.DEMO) {
      res.sendStatus(403);
      return;
    }

    const userId = Number(req.user);

    const { currentPassword, newPassword } = req.body;

    if (newPassword.trim().length === 0) {
      res.sendStatus(400);
      return;
    }

    const user = await userRepository.findOneWithPassword({ id: userId });

    if (!(await userRepository.verifyPassword(user, currentPassword))) {
      res.sendStatus(401);
      return;
    }

    await userRepository.update({
      id: user.id,
      password: newPassword,
    });

    res.sendStatus(200);
  });

  /**
   * @openapi_operationId getById
   */
  getById = createExpressRoute<{
    path: '/api/user/:userId';
    method: 'get';
    pathParams: {
      userId: number;
    };
    responseBody: undefined | Pick<UserResponse, 'id' | 'name'>;
  }>(async (req, res) => {
    const { userId } = req.params;

    const user = await userRepository.findOne({ id: userId });

    if (user) {
      res.send(_.pick(user, ['id', 'name']));
    } else {
      res.send(null);
    }
  });
}
