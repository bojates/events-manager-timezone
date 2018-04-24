/*
  Functions not requiring jQuery
*/

function setTimeZone(timezone) {
    var timezone = timezone;
    Cookies.set('user-timezone', timezone);
}

function setDefaultTimeZone() {
    var timezone = 'Europe/London'; // <- Should match your WP timezone.
    setTimeZone(timezone);
    return timezone;
}

function getTimeZone() {
    if (Cookies.get('user-timezone')) {
        var timezone = Cookies.get('user-timezone');
    } else {
        var timezone = setDefaultTimeZone();
    };
    return timezone;
}


jQuery(document).ready(function() {

  /*
    Settings
  */
  var defaultTimeZone = 'Europe/London'; // Should be the same as the WP timezone.
  var displayDefaultTimeZone = 'London'; // The name of the timezone to appear on the events entry page.

  // console.log('here');
  /*
    Functions using jQuery
  */
  // Function to refresh the dates and times on the page according to timezone
  // Assumes a 'timezone' is set
  var refreshTimes = (function() {
    // Find eventdatetimes - this is how we style our events
    jQuery('.timesTranslate').remove();
    jQuery(".eventdatetime").each(function() {

      var dataStart = jQuery(this).data('eventstart').substring(0,19);
      var dataEnd = jQuery(this).data('eventend').substring(0,19);

      // Data for start and end is attached to the eventdatetimes class
      var eventStart = moment.tz(dataStart, defaultTimeZone);
      var eventEnd = moment.tz(dataEnd, defaultTimeZone);

      var timezoneStart = moment.tz(dataStart, timezone);
      var timezoneEnd = moment.tz(dataEnd, timezone);

      // These are our display placeholders
      var displayDate = jQuery(this).find('.eventdates');
      var displayTime = jQuery(this).find('.eventtime');

      // console.log(displayTime);
      // Format the date

      if (timezoneStart.isSame(timezoneEnd, 'day')) {
        var dateToDisplay = timezoneStart.format('D MMMM YY');
      } else {
        var dateToDisplay = timezoneStart.format('D MMMM YY') + ' - ' + timezoneEnd.format('D MMMM YY') ;
      }

      // console.log(eventStart.format('YYYY-MM-DD'));
      // console.log(timezoneStart.format('YYYY-MM-DD'));
      if (eventStart.isSame(timezoneStart.format('YYYY-MM-DD'), 'day')) {
        var alertDateChange = '';
      } else {
        if (eventStart.isBefore(timezoneStart.format('YYYY-MM-DD'), 'day')) {
          var alertDateChange = ' <strong>next day</strong>';
        } else {
          var alertDateChange = ' <strong>previous day</strong>';
        }
      }

      // Format the time
      if (timezoneStart.isSame(timezoneEnd, 'minute')) {
        var timeToDisplay = timezoneStart.format('h:mm a z');
      // } else if ('0:00' == eventStart.tz('UTC').format('H:mm') && '23:59' == eventEnd.tz('UTC').format('H:mm')) {
      } else if ('0:00' == eventStart.format('H:mm') && '23:59' == eventEnd.format('H:mm')) {
        var timeToDisplay = 'all day' + alertDateChange;
      } else {
        var timeToDisplay = '<p class="timesTranslate"> [' + timezoneStart.format('h:mm a') + ' - ' + timezoneEnd.format('h:mm a z') + alertDateChange + ']</p>';
      }

      // Write the dates and time back to the page

      displayDate.text(dateToDisplay);
      displayTime.append(timeToDisplay);
      // displayTime.append(alertDateChange);
      // Debug
      // console.log(timeDisplay);
    });
  });


  // Function to build our timezone picker
  var populateTimeZonePicker = (function() {
    jQuery.each(en_GB_cldr_timezones_hash, function(key, value) {
      if (key == timezone) {
          var selected = ' SELECTED';
      } else {
          var selected = '';
      }
      jQuery('select.timezonepicker').append('<option value="' + key + '"'
                                               + selected
                                               + '>'
                                               + key + ' ' + value.substring(0, 11)
                                               + '</option>');
    });
  });

  /*
    The actual work starts here
  */
  var timezone = getTimeZone(); // Get from Cookie, or sets default
  displayTimes(); // shows the times on the page with the set timezone
  populateTimeZonePicker();

  /*
    Manipulate the event entry page with js. For ref, the forms live in
    plugins/events-manager/templates/forms/event-editor.php and event/when.php (and the recurring ones in that folder)
  */

  jQuery('.em-time-range').append('<br><span class="info">Enter times in ' +
                                    displayDefaultTimeZone +
                                    ' time (your local time, if different, will be shown alongside)</span><br>');

  if (jQuery('input.em-time-start').length) {
    var placeholderStartMoment = moment.tz(jQuery('input.em-time-start').val(), 'HH:mm a', defaultTimeZone);
    var placeholderEndMoment = moment.tz(jQuery('input.em-time-end').val(), 'HH:mm a', defaultTimeZone);
    var tzStartPlaceholder = placeholderStartMoment.clone().tz(timezone).format('HH:mm z');
    var tzEndPlaceholder = placeholderEndMoment.clone().tz(timezone).format('HH:mm z');
    jQuery('input.em-time-start').after("<span class='tztranslatorEnd'> (" + tzStartPlaceholder + ")</span>");
    jQuery('input.em-time-end').after("<span class='tztranslatorEnd'> (" + tzEndPlaceholder + ")</span>");
  };

  jQuery('input.em-time-start').change(function() {
    // Find and translate
    var startMoment = moment.tz(jQuery(this).val(), 'HH:mm a', defaultTimeZone);
    var tzfieldstart = startMoment.clone().tz(timezone).format('HH:mm z');

    // Chuck it in the page
    jQuery('.tztranslatorStart').remove();
    jQuery(this).after("<span class='tztranslatorStart'> (" + tzfieldstart + ")</span>");
  });

  jQuery('input.em-time-end').change(function() {
    // Find and translate
    var endMoment = moment.tz(jQuery(this).val(), 'HH:mm a', defaultTimeZone);
    var tzfieldend = endMoment.clone().tz(timezone).format('HH:mm z');

    // Chuck it in the page
    jQuery('.tztranslatorEnd').remove();
    jQuery(this).after("<span class='tztranslatorEnd'> (" + tzfieldend + ")</span>");
  });

  // Remove the option to create 'all day' events
  jQuery("p.em-time-range").replaceText(/All day/, "");
  jQuery('#em-time-all-day').hide();

  /* Event display pages */
  // Watch for timezone changes, and reset cookie, and reset times on page
  jQuery('select.timezonepicker').change(function() {
    setTimeZone(jQuery( ".timezonepicker" ).val());
    timezone = getTimeZone();
    location.reload(true);
    displayTimes();
  });

  // Watch for Ajax refresh on the calendar and refresh times if we need to
  jQuery(document).ajaxSuccess(function() {
      displayTimes();
    });

});


// Our hash of timezones to list on the page. From:
// https://github.com/anamartinez/js-cldr-timezones/blob/master/lib/assets/javascripts/js_cldr/en_GB_cldr_timezones.js
var en_GB_cldr_timezones_hash = {
    "Pacific/Midway":"(GMT-11:00) Midway",
    "Pacific/Pago_Pago":"(GMT-11:00) Pago Pago",
    "Pacific/Honolulu":"(GMT-10:00) ",
    "America/Juneau":"(GMT-09:00) Juneau",
    "America/Los_Angeles":"(GMT-08:00) Los Angeles",
    "America/Tijuana":"(GMT-08:00) Tijuana",
    "America/Denver":"(GMT-07:00) Denver",
    "America/Phoenix":"(GMT-07:00) Phoenix",
    "America/Chihuahua":"(GMT-07:00) Chihuahua",
    "America/Mazatlan":"(GMT-07:00) Mazatlan",
    "America/Chicago":"(GMT-06:00) Chicago",
    "America/Regina":"(GMT-06:00) Regina",
    "America/Mexico_City":"(GMT-06:00) Mexico City",
    "America/Monterrey":"(GMT-06:00) Monterrey",
    "America/Guatemala":"(GMT-06:00) Guatemala",
    "America/New_York":"(GMT-05:00) New York",
    "America/Indiana/Indianapolis":"(GMT-05:00) Indianapolis, Indiana",
    "America/Bogota":"(GMT-05:00) Bogota",
    "America/Lima":"(GMT-05:00) Lima",
    "America/Halifax":"(GMT-04:00) Halifax",
    "America/Caracas":"(GMT-04:30) Caracas",
    "America/La_Paz":"(GMT-04:00) La Paz",
    "America/Santiago":"(GMT-03:00) Santiago",
    "America/St_Johns":"(GMT-03:30) St. John’s",
    "America/Sao_Paulo":"(GMT-02:00) Sao Paulo",
    "America/Argentina/Buenos_Aires":"(GMT-03:00) Buenos Aires, Argentina",
    "America/Guyana":"(GMT-04:00) Guyana",
    "America/Godthab":"(GMT-03:00) Godthab",
    "Atlantic/South_Georgia":"(GMT-02:00) South Georgia",
    "Atlantic/Azores":"(GMT-01:00) Azores",
    "Atlantic/Cape_Verde":"(GMT-01:00) Cape Verde",
    "Europe/Dublin":"(GMT+00:00) ",
    "Europe/London":"(GMT+00:00) ",
    "Europe/Lisbon":"(GMT+00:00) Lisbon",
    "Africa/Casablanca":"(GMT+00:00) Casablanca",
    "Africa/Monrovia":"(GMT+00:00) Monrovia",
    "Etc/UTC":"(GMT+00:00) UTC",
    "Europe/Belgrade":"(GMT+01:00) Belgrade",
    "Europe/Bratislava":"(GMT+01:00) Bratislava",
    "Europe/Budapest":"(GMT+01:00) Budapest",
    "Europe/Ljubljana":"(GMT+01:00) Ljubljana",
    "Europe/Prague":"(GMT+01:00) Prague",
    "Europe/Sarajevo":"(GMT+01:00) Sarajevo",
    "Europe/Skopje":"(GMT+01:00) Skopje",
    "Europe/Warsaw":"(GMT+01:00) Warsaw",
    "Europe/Zagreb":"(GMT+01:00) Zagreb",
    "Europe/Brussels":"(GMT+01:00) Brussels",
    "Europe/Copenhagen":"(GMT+01:00) Copenhagen",
    "Europe/Madrid":"(GMT+01:00) Madrid",
    "Europe/Paris":"(GMT+01:00) Paris",
    "Europe/Amsterdam":"(GMT+01:00) Amsterdam",
    "Europe/Berlin":"(GMT+01:00) Berlin",
    "Europe/Rome":"(GMT+01:00) Rome",
    "Europe/Stockholm":"(GMT+01:00) Stockholm",
    "Europe/Vienna":"(GMT+01:00) Vienna",
    "Africa/Algiers":"(GMT+01:00) Algiers",
    "Europe/Bucharest":"(GMT+02:00) Bucharest",
    "Africa/Cairo":"(GMT+02:00) Cairo",
    "Europe/Helsinki":"(GMT+02:00) Helsinki",
    "Europe/Kiev":"(GMT+02:00) Kiev",
    "Europe/Riga":"(GMT+02:00) Riga",
    "Europe/Sofia":"(GMT+02:00) Sofia",
    "Europe/Tallinn":"(GMT+02:00) Tallinn",
    "Europe/Vilnius":"(GMT+02:00) Vilnius",
    "Europe/Athens":"(GMT+02:00) Athens",
    "Europe/Istanbul":"(GMT+02:00) Istanbul",
    "Europe/Minsk":"(GMT+03:00) Minsk",
    "Asia/Jerusalem":"(GMT+02:00) Jerusalem",
    "Africa/Harare":"(GMT+02:00) Harare",
    "Africa/Johannesburg":"(GMT+02:00) Johannesburg",
    "Europe/Volgograd":"(GMT+04:00) Volgograd",
    "Europe/Moscow":"(GMT+04:00) Moscow",
    "Asia/Kuwait":"(GMT+03:00) Kuwait",
    "Asia/Riyadh":"(GMT+03:00) Riyadh",
    "Africa/Nairobi":"(GMT+03:00) Nairobi",
    "Asia/Baghdad":"(GMT+03:00) Baghdad",
    "Asia/Tehran":"(GMT+03:30) Tehran",
    "Asia/Muscat":"(GMT+04:00) Muscat",
    "Asia/Baku":"(GMT+04:00) Baku",
    "Asia/Tbilisi":"(GMT+04:00) Tbilisi",
    "Asia/Yerevan":"(GMT+04:00) Yerevan",
    "Asia/Kabul":"(GMT+04:30) Kabul",
    "Asia/Yekaterinburg":"(GMT+06:00) Yekaterinburg",
    "Asia/Karachi":"(GMT+05:00) Karachi",
    "Asia/Tashkent":"(GMT+05:00) Tashkent",
    "Asia/Calcutta":"(GMT+05:30) Kolkata",
    "Asia/Kathmandu":"(GMT+05:45) Kathmandu",
    "Asia/Dhaka":"(GMT+06:00) Dhaka",
    "Asia/Colombo":"(GMT+05:30) Colombo",
    "Asia/Almaty":"(GMT+06:00) Almaty",
    "Asia/Novosibirsk":"(GMT+07:00) Novosibirsk",
    "Asia/Rangoon":"(GMT+06:30) Rangoon",
    "Asia/Bangkok":"(GMT+07:00) Bangkok",
    "Asia/Jakarta":"(GMT+07:00) Jakarta",
    "Asia/Krasnoyarsk":"(GMT+08:00) Krasnoyarsk",
    "Asia/Shanghai":"(GMT+08:00) Shanghai",
    "Asia/Chongqing":"(GMT+08:00) Chongqing",
    "Asia/Hong_Kong":"(GMT+08:00) Hong Kong",
    "Asia/Urumqi":"(GMT+08:00) Urumqi",
    "Asia/Kuala_Lumpur":"(GMT+08:00) Kuala Lumpur",
    "Asia/Singapore":"(GMT+08:00) Singapore",
    "Asia/Taipei":"(GMT+08:00) Taipei",
    "Australia/Perth":"(GMT+08:00) Perth",
    "Asia/Irkutsk":"(GMT+09:00) Irkutsk",
    "Asia/Ulaanbaatar":"(GMT+08:00) Ulaanbaatar",
    "Asia/Seoul":"(GMT+09:00) Seoul",
    "Asia/Tokyo":"(GMT+09:00) Tokyo",
    "Asia/Yakutsk":"(GMT+10:00) Yakutsk",
    "Australia/Darwin":"(GMT+09:30) Darwin",
    "Australia/Adelaide":"(GMT+10:30) Adelaide",
    "Australia/Melbourne":"(GMT+11:00) Melbourne",
    "Australia/Sydney":"(GMT+11:00) Sydney",
    "Australia/Brisbane":"(GMT+10:00) Brisbane",
    "Australia/Hobart":"(GMT+11:00) Hobart",
    "Asia/Vladivostok":"(GMT+11:00) Vladivostok",
    "Pacific/Guam":"(GMT+10:00) Guam",
    "Pacific/Port_Moresby":"(GMT+10:00) Port Moresby",
    "Asia/Magadan":"(GMT+12:00) Magadan",
    "Pacific/Noumea":"(GMT+11:00) Noumea",
    "Pacific/Fiji":"(GMT+12:00) Fiji",
    "Asia/Kamchatka":"(GMT+12:00) Kamchatka",
    "Pacific/Majuro":"(GMT+12:00) Majuro",
    "Pacific/Auckland":"(GMT+13:00) Auckland",
    "Pacific/Tongatapu":"(GMT+13:00) Tongatapu"
};
