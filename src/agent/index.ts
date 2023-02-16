/**
 * The dependency tree gets a little complex here:
 *
 * cmd
 *  -> network
 *    -> user, pool
 *      -> keys
 *      -> sync
 *        -> database
 *
 * In other words, command/network depend on utility functions and the network to
 * do their job. The database sits at the bottom since it's shared between user
 * which query the database, and network which both queries and updates it.
 */
