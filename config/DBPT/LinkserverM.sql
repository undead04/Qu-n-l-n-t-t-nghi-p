
EXEC sp_linkedservers;
-- =============================================
-- Kết nối server đến 2 server khoa
-- =============================================

EXEC sp_addlinkedserver 
    @server     = N'DBTN_CNTT',
    @srvproduct = N'',                -- để trống để được phép dùng @datasrc
    @provider   = N'SQLNCLI',      -- hoặc 'SQLNCLI' nếu bản cũ
    @datasrc    = N'VANAN\SQLEXPRESS',
    @catalog    = N'DBTN_CNTT' ;
GO

EXEC sp_addlinkedsrvlogin 
    @rmtsrvname = N'DBTN_CNTT', 
    @useself    = N'False',              -- dùng tài khoản riêng
    @locallogin = NULL, 
    @rmtuser    = N'sa', 
    @rmtpassword= N'123456';
GO

EXEC sp_addlinkedserver 
    @server     = N'DBTN_CK',
    @srvproduct = N'',                -- để trống để được phép dùng @datasrc
    @provider   = N'SQLNCLI',      -- hoặc 'SQLNCLI' nếu bản cũ
    @datasrc    = N'VANAN\SQLEXPRESS',
    @catalog    = N'DBTN_CK' ;
GO

EXEC sp_addlinkedsrvlogin 
    @rmtsrvname = N'DBTN_CK', 
    @useself    = N'False',              -- dùng tài khoản riêng
    @locallogin = NULL, 
    @rmtuser    = N'sa', 
    @rmtpassword= N'123456';
GO
-- =============================================
-- Mở kết nối có thể từ server này gọi proc của server kia
-- =============================================
EXEC sp_serveroption 'DBTN_CNTT', 'rpc', true;
EXEC sp_serveroption 'DBTN_CNTT', 'rpc out', true;
EXEC sp_serveroption 'DBTN_CK', 'rpc', true;
EXEC sp_serveroption 'DBTN_CK', 'rpc out', true;
-- =============================================
-- Test kết nối có thành công không
-- =============================================
EXEC sp_testlinkedserver N'DBTN_CNTT';
EXEC sp_testlinkedserver N'DBTN_CK';
GO