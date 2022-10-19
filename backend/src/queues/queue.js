// --------- Install bull, ioredis, and redis instance--------- //
const Queue = require('bull')
const Redis = require('ioredis')
const { redis } = require('../config/vars')

const redisCreds = {
    host: redis.host,
    port: redis.port,
    // db: process.env.REDIS_DB || 0,
    no_ready_check: true,
    password: redis.password,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
}

const client = new Redis(redisCreds)
// console.log('client', client)
const subscriber = new Redis(redisCreds)
// console.log('subscriber', subscriber)
const opts = {
    defaultJobOptions: {
        // backoff: {
        //   type: 'fixed',
        //   delay: 3000,
        // },
        attempts: 2,
        removeOnFail: true,
        removeOnComplete: true,
    },
    createClient(type) {
        switch (type) {
            case 'client':
                return client
            case 'subscriber':
                return subscriber
            default:
                return new Redis(redisCreds)
        }
    },
}

const Service = {
    queues: {},
    hasQById(queueId = 'root') {
        console.log('root', queueId)
        return !!Service.queues[queueId]
    },

    getQuById(queueId = 'root') {
        if (!Service.queues[queueId]) {
            console.log('want to check the queue id for mintsclub')
            const queue = new Queue(`mintsclub_queue_${queueId}`, opts)
            queue.queueId = queueId

            queue
                // An error occured.
                .on('error', function () {
                    console.log('queue on functions')
                    // const stack = error.stack || error.stacktrace || error.trace;
                    //   logger.error(
                    //     `[Job Queue][${queueId}][error] Stack: ${stack} `,
                    //     error,
                    //   );
                })
                // A Job is waiting to be processed as soon as a worker is idling.
                .on('waiting', function () {
                    console.log('queue waiting functions')
                    //   logger.info(`[Job Queue][${queueId}][waiting] JobId: ${jobId}`);
                })
                // A job has started. You can use `jobPromise.cancel()`` to abort it.
                .on('active', function (/* , jobPromise */) {
                    console.log('queue active functions')
                    //   logger.info(`[Job Queue][${queueId}][active] JobId: ${job.id}`);
                })
                // A job has been marked as stalled. This is useful for debugging job
                // workers that crash or pause the event loop.
                .on('stalled', function () {
                    console.log('queue stalled functions')
                    //   logger.info(`[Job Queue][${queueId}][stalled] JobId: ${job.id}`);
                })
                //   // A job's progress was updated!
                //   .on('progress', function(job, progress) {
                //     logger.info('[progress] ' + job.id + progress);
                //   })
                // A job successfully completed with a `result`.
                .on('completed', function (/* result */) {
                    console.log('queue completed functions')

                    //   logger.info(`[Job Queue][${queueId}][completed] JobId: ${job.id}`);
                })
                // A job failed with reason `err`!
                .on('failed', function () {
                    console.log('queue failed functions')

                    // const stack = error.stack || error.stacktrace || error.trace;
                    //   logger.error(
                    //     `[Job Queue][${queueId}][failed] JobId: ${job.id} Stack: ${stack} `,
                    //     error,
                    //   );
                })
                //   // The queue has been paused.
                //   .on('paused', function() {
                //     logger.info('[paused] ');
                //   })
                //   // The queue has been resumed.
                //   .on('resumed', function(job) {
                //     logger.info('[resumed] ' + job.id);
                //   })
                // Old jobs have been cleaned from the queue. `jobs` is an array of cleaned
                // jobs, and `type` is the type of jobs cleaned.
                .on('cleaned', function () {
                    console.log('queue cleaned functions')

                    //   logger.info(
                    //     `[Job Queue][${queueId}][cleaned] Jobs: ${jobs.length} Type: ${type}`,
                    //   );
                })
                // Emitted every time the queue has processed all the waiting jobs
                // (even if there can be some delayed jobs not yet processed)
                .on('drained', function () {
                    console.log('queue drained functions')

                    //   logger.info(`[Job Queue][${queueId}][drained]`);
                })
                // A job successfully removed.
                .on('removed', function () {
                    console.log('queue removed functions')

                    //   logger.info(`[Job Queue][${queueId}][removed] JobId: ${job.id}`);
                })

            Service.queues[queueId] = queue
        }

        return Service.queues[queueId]
    },
}

module.exports = Service
