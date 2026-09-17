import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://gmzzicwntezdmzriwswh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtenppY3dudGV6ZG16cml3c3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1ODk3OTcsImV4cCI6MjEwNTE2NTc5N30.0wDq7pZ4v_SrZfF3-aLlaUENj3ZMoGYkv5yBVQGYEyo'
)