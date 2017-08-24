<?php
/**
 * Plugin Name: Events Manager TimeZones
 * Description: Hooks into two functions that get events, and changes the times and dates based on the user's timezone. JS and cookies to set the timezone and display the timezone.
 * Version: 2.0.0
 * Author: Jemima Kingsley
 * Author URI: http://websitedepartment.co.uk/
 * License: GNU General Public License v3.0
 * License URI: http://www.gnu.org/licenses/gpl-3.0.html
 */

// We could decide to pull in the WordPress tz here, but for now, just set it.
function emtz_default_timezone() {
    return 'Europe/London';
}

function emtz_filter_em_get_event($event) {

    $new_event_dates = emtz_translate_event_timezone($event->start_date,
                               $event->start_time,
                               $event->end_date,
                               $event->end_time,
                               emtz_default_timezone(),
                               $_COOKIE['user-timezone'],
                               $event->event_all_day);

    $event->start_date = $event->event_start_date = $new_event_dates[0];
    $event->start_time = $event->event_start_time = $new_event_dates[1];
    $event->start = $new_event_dates[2];

    $event->end_date = $event->event_end_date = $new_event_dates[3];
    $event->end_time = $event->event_end_time = $new_event_dates[4];
    $event->end = $new_event_dates[5];

    return $event;
}

function emtz_filter_em_events_get_array($events) {

    foreach($events as $e) {

        $new_info = emtz_translate_event_timezone($e['event_start_date'],
                                   $e['event_start_time'],
                                   $e['event_end_date'],
                                   $e['event_end_time'],
                                   emtz_default_timezone(),
                                   $_COOKIE['user-timezone'],
                                   $e['event_all_day']);

        $e['start_date'] = $e['event_start_date'] = $new_info[0];
        $e['start_time'] = $e['event_start_time'] = $new_info[1];
        $e['start'] = $new_info[2];

        $e['end_date'] = $e['event_end_date'] = $new_info[3];
        $e['end_time'] = $e['event_end_time'] = $new_info[4];
        $e['end'] = $new_info[5];

        $retevents[] = $e;
    }

    // print '<pre>';
    // print_r($retevents);
    // print '</pre>';

    return $retevents;
}

function emtz_translate_event_timezone($start_date, $start_time,
                                  $end_date, $end_time,
                                  $original_time_zone,
                                  $target_time_zone = '',
                                  $all_day = false) {

    // Return original values if we've not been given a timezone
    if ($target_time_zone == '') {
        $start_timestamp = strtotime($start_date . 'T' . $start_time);
        $end_timestamp = strtotime($end_date . 'T' . $end_time);

        return array($start_date, $start_time, $start_timestamp,
                 $end_date, $end_time, $end_timestamp);
    }

    // Otherwise, do our transations
    $start_date_time = new DateTime($start_date . 'T' . $start_time,
                         new DateTimeZone($original_time_zone));

    $end_date_time = new DateTime($end_date . 'T' . $end_time,
                         new DateTimeZone($original_time_zone));

    $start_date_time->setTimezone(new DateTimeZone($target_time_zone));
    $end_date_time->setTimezone(new DateTimeZone($target_time_zone));

    $new_start_date = $start_date_time->format('Y-m-d');
    $new_start_time = $start_date_time->format('H:i:s');

    $new_end_date = $end_date_time->format('Y-m-d');
    $new_end_time = $end_date_time->format('H:i:s');

    // We disallow 'all day' in the entering screen
    // if ($all_day == true || ($start_time == '00:00:00' && $end_time == '23:59:00')) {
    //     $new_start_time = '00:00:00';
    //     $new_end_time = '23:59:00';
    // }

    $new_start_timestamp = strtotime($new_start_date . 'T' . $new_start_time);
    $new_end_timestamp = strtotime($new_end_date . 'T' . $new_end_time);

    return array($new_start_date, $new_start_time, $new_start_timestamp,
                 $new_end_date, $new_end_time, $new_end_timestamp);

}

add_filter('em_get_event', 'emtz_filter_em_get_event');
add_filter('em_events_get_array', 'emtz_filter_em_events_get_array');

// global $Events_Manager_TimeZones;

$Events_Manager_TimeZones = new Events_Manager_TimeZones;
class Events_Manager_TimeZones {
    private $textdomain = "Events_Manager_TimeZones";
    private $required_plugins = array('events-manager');
    function have_required_plugins() {
        if (empty($this->required_plugins))
            return true;
        $active_plugins = (array) get_option('active_plugins', array());
        if (is_multisite()) {
            $active_plugins = array_merge($active_plugins, get_site_option('active_sitewide_plugins', array()));
        }
        foreach ($this->required_plugins as $key => $required) {
            $required = (!is_numeric($key)) ? "{$key}/{$required}.php" : "{$required}/{$required}.php";
            if (!in_array($required, $active_plugins) && !array_key_exists($required, $active_plugins))
                return false;
        }
        return true;
    }
    function __construct() {
        if (!$this->have_required_plugins())
            return;
        load_plugin_textdomain($this->textdomain, false, dirname(plugin_basename(__FILE__)) . '/languages');

        wp_enqueue_script( 'js-cookie',
                            plugin_dir_url( __FILE__ ) . 'js/js.cookie.js',
                            array ( ),
                            1.0,
                            true);

        // We call it bp-moment because that's what BuddyPress calls it. If we don't use the same name, they fight each other and timezones don't work in BuddyPress.
        wp_enqueue_script( 'bp-moment',
                            plugin_dir_url( __FILE__ ) . 'js/moment.js',
                            array ( ),
                            2.18,
                            true);

        wp_enqueue_script( 'moment-timezone-with-data-2012-2022',
                            plugin_dir_url( __FILE__ ) . 'js/moment-timezone-with-data-2012-2022.js',
                            array ( 'bp-moment' ),
                            1.0,
                            true);

        wp_enqueue_script( 'jquery-replacetext-plugin',
                            plugin_dir_url( __FILE__ ) . 'js/jquery-replacetext-plugin.js',
                            array (),
                            1.0,
                            true);

        wp_enqueue_script( 'events-manager-timezones',
                            plugin_dir_url( __FILE__ ) . 'js/events-manager-timezone.js',
                            array ( 'jquery',
                                    'bp-moment',
                                    'moment-timezone-with-data-2012-2022',
                                    'js-cookie',
                                    'jquery-replacetext-plugin' ),
                            1.0,
                            true);

        do_action( 'bp_enqueue_scripts', 'events-manager-timezones' );
    }
}
