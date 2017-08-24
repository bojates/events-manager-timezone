# Events Manager Timezones
Author: Jemima Kingsley, jemima@websitedepartment.co.uk

## Description
Events Manager is a great plugin for WordPress which lets you create events either in the front or back end, and display them in a list, in calendar view, and in individual pages. It integrates, if desired, with BuddyPress groups.

However, it only operates in the timezone that WordPress is setup in and is not timezone aware.

This plugin intercepts the events coming out of the database and changes them based on the user's timezone (which is remembered using a cookie).

Fundamentally, this plugin:
1. Adds a timezone picker to the page and stores the user option in a cookie.
2. Intercepts two core functions in Events Manager and changes the times (and dates) to the user timezone.
3. Displays the events using the timezone abbreviation, so you know where you are.

### Requirements
  - [Events Manager](http://wp-events-plugin.com/), obviously:
  - jQuery (comes with WordPress)
  - [Moment and Moment Timezone](http://momentjs.com/): (Bundled in the js directory of this plugin)
  - [JS Cookie](https://github.com/js-cookie/js-cookie): (Bundled in the js directory of this plugin)
  - [jquery-replacetext-plugin](http://benalman.com/projects/jquery-replacetext-plugin/): (Bundled in the js directory of this plugin) 

### How it works
#### Timezone picker
It expects this on the page
```
<form><select class="timezonepicker"></select></form>
```
It appends the contents of the select with the list of timezones at the end of the main JavaScript file.
On change, it sets a cookie (and one is set as default).
It checks for the cookie when the script is called.

#### Applying the new timezone
The plugin adds hooks that latch on to em_get_event and em_events_get_array. These events are translated into the timezone in the cookie, and Events Manager then treats them as normal. 

#### Replacing the values on the event addition page
It looks for the start and end times on the form, and adds timezone translations next to it.

Events Manager is not aware of timezone, and doesn't store in UTC, so we need to translate from the current WP timezone to help people enter their events properly.

#### Replacing values on calendar and events listing (for showing which timezone you're in)
It expects Events Manager to give it dates in this format (the li is an example. Can be any tag, including span.)

```
<li class='eventdatetime' data-eventstart="#c" data-eventend="#@c">
  #_EVENTLINK
  <span class="eventdates">#_EVENTDATES</span>
  <span class="eventtime">#_EVENTTIMES</span>
</li>
```
It uses the data values to get the times, and replaces the values in the eventdates and eventtime spans.

#### Replacing values on the edit events page (for showing which timezone you're in)
The edit events template needs replacing with one that embeds the complete datetime data (details of how to do this are below). It then replaces in the same way as the calendar and events page.

### Defaults
It assumes the WordPress timezone is set to London, but it's possible to change (details below).

### Known bugs
 - Not all the BuddyPress and Events templates that might show times have been identified.

### Possible improvements to the plugin
 - We could probably grab the WordPress timezone and make it available to the Plugin and JavaScript without requiring user configuration 
 - It's possible we could put the template overrides in this plugin folder, rather than the theme folder

## Installation
### 1. Install the relevant plugins
In WordPress, install and activate Events Manager and then install and activate this Plugin. I suggest using folder name ``events-manager-timezones``.

### 2. Change the default timezone in the JavaScript and PHP
If you don't want to use London as your default timezone. This should match your WordPress timezone setting.

Open ``js/events-manager-timezone.js`` and edit it to set your timezone. It is set twice -
 - var defaultTimeZone
 - setDefaultTimeZone function (for the initial cookie).

Open ``events-manager-timezones.php`` and change the timezone in the first function emtz_default_timezone.

### 3. Add the TimeZone picker
Using the regular WordPress admin, edit your calendar and event list pages. Where you want the TimeZone picker, add:
```
<form><select class="timezonepicker"></select></form>
```
### 4. Edit the Events Manager fields
In the regular WordPress admin for Events Manager settings ensure you have eventdatetime with data-eventstart and data-eventend. e.g.
```
<li class='eventdatetime' data-eventstart="#c" data-eventend="#@c">#_EVENTLINK
<span class="eventdates">#_EVENTDATES</span>
<span class="eventtime">#_EVENTTIMES</span></li>
```
This needs updating in about 4 fields. (#c and #@c puts the date in a standard format the JS in this plugin expects.)

This just makes it possible to display the timezone. (Version 1 of this plugin used this for all the timezone translation, but we've moved that to the PHP now.)

### 5. Edit events listing template
You need to copy a couple of files from the source folder in Plugins to your Theme folder, and edit them there.

**If you're allowing people to edit events in the front end**

Copy
``plugins/events-manager/tables/events.php ``
to ``
themes/[your theme folder]/plugins/events-manager/tables/events.php``

**If you're using BuddyPress**

Copy
``plugins/events-manager/buddypress/group-events.php``
to
``themes/[your theme folder]/plugins/events-manager/buddypress/group-events.php``

Then edit the templates to include the full datetime for the events.

e.g. My tables/events.php template has this block in it:
```
  <td class='eventdatetime' data-eventstart="<?php echo date('c', $EM_Event->start); ?>" data-eventend="<?php echo date('c', $EM_Event->end); ?>">
            <span class="eventdates">
              <?php echo $localised_start_date; ?>
              <?php echo ($localised_end_date != $localised_start_date) ? " - $localised_end_date":'' ?>
              </span>
              <br />
              <span class="eventtime">
              <?php
                if(!$EM_Event->event_all_day){
                  echo date_i18n(get_option('time_format'), $EM_Event->start) . " - " . date_i18n(get_option('time_format'), $EM_Event->end);
                }else{
                  echo get_option('dbem_event_all_day_message');
                }
              ?>
              </span>
            </td>
```
## Feedback

Constructive feedback very welcome. This is my first real attempt at this sort of thing with JS and my first attempt at a WordPress plugin. How should I have structured this code better? etc.?
