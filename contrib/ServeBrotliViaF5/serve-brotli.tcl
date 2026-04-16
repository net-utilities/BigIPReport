when HTTP_REQUEST {
  set has_replaced 0
  if {
    [HTTP::header Accept-Encoding] contains "br"
    && [HTTP::uri] ends_with ".json"
    && [HTTP::uri] ne "/json/knowndevices.json"
   } {
    HTTP::uri "[HTTP::uri].br"
    set has_replaced 1
  }
}

when HTTP_RESPONSE {
  if { $has_replaced } {
    HTTP::header replace "Content-Encoding" "br"
    HTTP::header insert Vary: Accept-Encoding
  }
}
