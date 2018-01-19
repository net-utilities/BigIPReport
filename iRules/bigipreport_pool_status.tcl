when HTTP_REQUEST {
	
    set poolname [HTTP::path]  

    if { [catch { 
        set poolmembers [members -list $poolname]

        set returnjson "\{\n\t\"success\"\:true,\n\t\"poolname\": \"$poolname\",\n\t\"memberstatuses\": \{"

        set membercount [llength $poolmembers]
        set i 0

        foreach poolmember $poolmembers {
            incr i
            set memberarr [split $poolmember " "]
            set memberip [lindex $memberarr 0]
            set memberport [lindex $memberarr 1]
            set status [LB::status pool $poolname member $memberip $memberport]
            set returnjson "$returnjson\n\t\t\"$memberip\:$memberport\"\:\t\"$status\""
            if { $i != $membercount } {
                set returnjson "$returnjson,"
            }
        }

        set returnjson "$returnjson\n\t\}\n\}"
        HTTP::respond 200 content $returnjson Content-Type application/json Access-Control-Allow-Origin "*" Connection Close

    } ] } {
        HTTP::respond 404 content "\{\
                        \t\"success\"\:false,\n\
                        \t\"error\"\: \{\n\
                            \t\t\"code\"\: 404,\n\
                            \t\t\"message\"\: \"No pool with that name\"\n\
                        \t\}\n\
                    \}" Content-Type application/json Access-Control-Allow-Origin "*" Connection Close
    }
	
}