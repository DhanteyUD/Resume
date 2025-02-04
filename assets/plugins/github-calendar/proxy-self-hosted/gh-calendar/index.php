<?php 
  require_once(dirname(__FILE__) . '/../util/index.php');


  $username = $_GET["username"];
  preg_match('/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i', $username, $matches, PREG_OFFSET_CAPTURE);
  if (!count($matches)) {
    return sendResponse([
       "error" => "Invalid username.",
       "error_code" => "INVALID_USERNAME"
    ]);
  }

  $url = "https://github.com/users/$username/contributions";

  $ch = curl_init();

  curl_setopt($ch, CURLOPT_URL,$url);
  curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
  curl_setopt($ch, CURLOPT_HEADER, 0);

  $curl_scraped_page = curl_exec($ch);
  curl_close($ch);
  
  cors();
  
  echo $curl_scraped_page;