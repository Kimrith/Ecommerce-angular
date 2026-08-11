$connString = "Server=localhost;Database=EcommerceDb;Trusted_Connection=True;TrustServerCertificate=True;Encrypt=False;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connString)
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = "UPDATE Auths SET ProfileImageUrl = '/uploads/7c02456c-1a46-4d4a-a0b4-7608f0333bc7.png' WHERE Id = 6"
$rows = $cmd.ExecuteNonQuery()
$conn.Close()
write-output "Updated $rows rows successfully!"
