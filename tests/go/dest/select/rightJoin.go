package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

// Field ...
func (mrTable *TableTypePost) Field(queryable mingru.Queryable) (string, error) {
	var result string
	err := queryable.QueryRow("SELECT `join_1`.`url_name` FROM `db_post` AS `db_post` RIGHT JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`").Scan(&result)
	if err != nil {
		return result, err
	}
	return result, nil
}

// FieldRows ...
func (mrTable *TableTypePost) FieldRows(queryable mingru.Queryable) ([]string, error) {
	rows, err := queryable.Query("SELECT `join_1`.`url_name` FROM `db_post` AS `db_post` RIGHT JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`")
	if err != nil {
		return nil, err
	}
	var result []string
	defer rows.Close()
	for rows.Next() {
		var item string
		err = rows.Scan(&item)
		if err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}
	return result, nil
}

// PostTableRowResult ...
type PostTableRowResult struct {
	ID          *uint64
	UserUrlName string
}

// Row ...
func (mrTable *TableTypePost) Row(queryable mingru.Queryable, id uint64) (PostTableRowResult, error) {
	var result PostTableRowResult
	err := queryable.QueryRow("SELECT `join_1`.`url_name`, `db_post`.`id` FROM `db_post` AS `db_post` RIGHT JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id` WHERE `db_post`.`id` = ?", id).Scan(&result.UserUrlName, &result.ID)
	if err != nil {
		return result, err
	}
	return result, nil
}

// PostTableRowsResult ...
type PostTableRowsResult struct {
	ID          *uint64
	UserUrlName string
}

// Rows ...
func (mrTable *TableTypePost) Rows(queryable mingru.Queryable) ([]PostTableRowsResult, error) {
	rows, err := queryable.Query("SELECT `join_1`.`url_name`, `db_post`.`id` FROM `db_post` AS `db_post` RIGHT JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`")
	if err != nil {
		return nil, err
	}
	var result []PostTableRowsResult
	defer rows.Close()
	for rows.Next() {
		var item PostTableRowsResult
		err = rows.Scan(&item.UserUrlName, &item.ID)
		if err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}
	return result, nil
}
