import { logger } from './logger.js';
import { formatDistance } from 'date-fns';
import { h } from './utils.js';

type BehaviorOnDuplicateJob = 'override' | 'keep';
type JobDetails = {
  name: string;
  date: Date;
  timeout: NodeJS.Timeout;
  behaviorOnDuplicateJob?: BehaviorOnDuplicateJob;
};

const scheduledJobs = new Map<NodeJS.Timeout, JobDetails>();
const scheduledJobsByName = new Map<string, Array<JobDetails>>();

const addJob = (jobDetails: JobDetails) => {
  scheduledJobs.set(jobDetails.timeout, jobDetails);

  const existingJobs = scheduledJobsByName.get(jobDetails.name);

  if (jobDetails.behaviorOnDuplicateJob === 'override') {
    existingJobs?.forEach((job) => cancelJob(job));
    scheduledJobsByName.set(jobDetails.name, [jobDetails]);
  } else {
    scheduledJobsByName.set(jobDetails.name, [
      ...(existingJobs ? existingJobs : []),
      jobDetails,
    ]);
  }
};
const removeJob = (jobDetails: JobDetails) => {
  scheduledJobs.delete(jobDetails.timeout);

  const existingJobs = scheduledJobsByName.get(jobDetails.name);

  if (existingJobs) {
    scheduledJobsByName.set(
      jobDetails.name,
      existingJobs.filter((item) => item.timeout !== jobDetails.timeout)
    );
  }
};

const cancelJob = (jobDetails: JobDetails) => {
  const { timeout, name, date } = jobDetails;
  logger.debug(h`removing scheduled job ${name} at ${date.toLocaleString()}`);
  clearTimeout(timeout);
  removeJob(jobDetails);
};

export const scheduleJob = (args: {
  job: () => void | Promise<void>;
  name: string;
  date: Date;
  behaviorOnDuplicateJob?: BehaviorOnDuplicateJob;
}) => {
  const { job, name, date, behaviorOnDuplicateJob } = args;

  logger.debug(
    h`scheduling job "${name}" at ${date.toLocaleString()}, in ${formatDistance(
      new Date(),
      date
    )}`
  );

  const jobDetails: JobDetails = {
    date,
    name,
    behaviorOnDuplicateJob,
    timeout: setTimeout(async () => {
      try {
        logger.debug(h`running scheduled job ${name}`);
        removeJob(jobDetails);
        await job();
      } catch (error) {
        logger.error(error);
      }
    }, date.getTime() - new Date().getTime()),
  };

  addJob(jobDetails);

  return {
    cancelJob: () => {
      cancelJob(jobDetails);
    },
  };
};
