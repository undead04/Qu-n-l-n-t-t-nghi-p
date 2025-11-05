EXEC sp_addlinkedserver 
    @server     = N'DBTN',
    @srvproduct = N'',                -- để trống để được phép dùng @datasrc
    @provider   = N'SQLNCLI',      -- hoặc 'SQLNCLI' nếu bản cũ
    @datasrc    = N'VANAN\SQLEXPRESS',
    @catalog    = N'DBTN' ;
GO

EXEC sp_addlinkedsrvlogin 
    @rmtsrvname = N'DBTN', 
    @useself    = N'False',              -- dùng tài khoản riêng
    @locallogin = NULL, 
    @rmtuser    = N'sa', 
    @rmtpassword= N'123456';
GO