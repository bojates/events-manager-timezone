=== Timezone translator for Events Manger for WordPress ===
Author: Jemima Kingsley 
URL:    jemima@websitedepartment.co.uk
Date:   2017-08-04
Notes:  Feedback very welcome. 
        My first real attempt at this sort of thing with JS.
        And my first attempt at a plugin. 
        How should I have structured this code better?
        etc.?

=== Description ===
1 - Adds a timezone picker to the page and stores the user option in a cookie.
2 - Finds and replaces the times and dates to match the given timezone.

= Requirements = 
  - Events Manager, obviously: http://wp-events-plugin.com/
  - jQuery (comes with WordPress)
  - Moment Timezone: (Bundled in the js directory of this plugin)
  - JS Cookie: (Bundled in the js directory of this plugin)

= How it works = 
* Timezone picker:
It expects this on the page
<form><select class="form-control timezonepicker"></select></form>
It appends the contents of the select with the list of timezones at the end of this file.
On change, it sets a cookie.
It checks for the cookie when the script is called.

* Replacing values on calendar and events listing:
It expects event manager to give it dates in this format (the li is an example. Can be any tag, including span.):
<li class='eventdatetime' data-eventstart="#c" data-eventend="#@c">#_EVENTLINK
<span class="eventdates">#_EVENTDATES</span>
<span class="eventtime">#_EVENTTIMES</span></li>

It uses the data values to get the times, and replaces the values in the eventdates and eventtime spans.

* Replacing the values on the event addition page:
It looks for the start and end times on the form, and adds timezone translations next to it.
Events Manager is not aware of timezone, and doesn't store in UTC, so you need to translate from the current WP tz.

* Replacing values on the edit events page:
This template needs replacing with one that embeds the correct data. It then replaces in the same way as the calendar and events page.

= DEFAULTS / BUGS = 
It assumes the WordPress timezone is set to London, and this default is in the code twice.
In calendar view, if the timezone adjustment means a date change, this isn't honoured.

== Instalation ==
1: Include the required JS.
Install and activate Events Manager and activate this Plugin.

2: Change the default timezone in this JS file to match your WordPress timezone.
Set as defaultTimeZone and also in the setDefaultTimeZone function for the initial cookie.

3: Add the TimeZone picker
Edit your calendar and event list pages, in the regular WordPress admin page editor. Where you want the TimeZone picker, add:
<form><select class="form-control timezonepicker"></select></form>

4: Edit the Events Manager fields
In the WordPress admin for Events Manager settings ensure you have eventdatetime with data-eventstart and data-eventend. e.g.

<li class='eventdatetime' data-eventstart="#c" data-eventend="#@c">#_EVENTLINK
<span class="eventdates">#_EVENTDATES</span>
<span class="eventtime">#_EVENTTIMES</span></li>

This needs updating in about 4 fields. (#c and #@c puts the date in a standard format the JS expects.)

5: Edit events listing template 
(only required if you allow people to edit events on the front end)
You need to copy a couple of files from the source folder in Plugins to your Theme folder, and edit them there. 

* If you're allowing people to edit events in the front end
Copy 
plugins/events-manager/tables/events.php 
to 
themes/[your theme folder]/plugins/events-manager/tables/events.php

* If you're using BuddyPress
Copy
plugins/events-manager/buddypress/group-events.php
to
themes/[your theme folder]/plugins/events-manager/buddypress/group-events.php

Then edit the templates to include the UTC time for the events. e.g. My tables/events.php template has this block in it:
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


=== Ends ===
